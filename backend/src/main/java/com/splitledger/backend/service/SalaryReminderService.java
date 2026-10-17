package com.splitledger.backend.service;

import com.splitledger.backend.entity.Notification;
import com.splitledger.backend.entity.SalaryCycle;
import com.splitledger.backend.entity.SalarySetting;
import com.splitledger.backend.enums.NotificationType;
import com.splitledger.backend.enums.SalaryCycleStatus;
import com.splitledger.backend.repository.NotificationRepository;
import com.splitledger.backend.repository.SalaryCycleRepository;
import com.splitledger.backend.repository.SalarySettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SalaryReminderService {

    /** Reminders go out on the credit date and on this many days after it. */
    public static final int REMINDER_DAYS_AFTER = 5;
    private static final int TOTAL_REMINDERS = REMINDER_DAYS_AFTER + 1;

    private final SalarySettingRepository salarySettingRepository;
    private final SalaryCycleRepository salaryCycleRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public void processReminders(LocalDate today) {
        createDueCycles(today);
        handlePendingCycles(today);
    }

    /** Creates a PENDING cycle for every active user whose reminder window includes today. */
    private void createDueCycles(LocalDate today) {
        YearMonth thisMonth = YearMonth.from(today);
        // The previous month matters because a window can spill over a month end.
        List<YearMonth> months = List.of(thisMonth.minusMonths(1), thisMonth);

        for (SalarySetting setting : salarySettingRepository.findByActiveTrue()) {
            for (YearMonth month : months) {
                LocalDate creditDate = effectiveCreditDate(month, setting.getCreditDay());
                LocalDate lastReminderDay = creditDate.plusDays(REMINDER_DAYS_AFTER);
                boolean inWindow = !today.isBefore(creditDate) && !today.isAfter(lastReminderDay);

                if (inWindow && !salaryCycleRepository
                        .existsByUserIdAndMonth(setting.getUser().getId(), month.atDay(1))) {
                    SalaryCycle cycle = new SalaryCycle();
                    cycle.setUser(setting.getUser());
                    cycle.setMonth(month.atDay(1));
                    cycle.setCreditDate(creditDate);
                    cycle.setExpectedAmount(setting.getAmount());
                    salaryCycleRepository.save(cycle);
                }
            }
        }
    }

    /** Sends today's reminder for each PENDING cycle, or marks it MISSED once its window is over. */
    private void handlePendingCycles(LocalDate today) {
        for (SalaryCycle cycle : salaryCycleRepository.findByStatus(SalaryCycleStatus.PENDING)) {
            LocalDate lastReminderDay = cycle.getCreditDate().plusDays(REMINDER_DAYS_AFTER);

            if (today.isAfter(lastReminderDay)) {
                cycle.setStatus(SalaryCycleStatus.MISSED);
                continue;
            }
            if (today.isBefore(cycle.getCreditDate()) || today.equals(cycle.getLastPromptedOn())) {
                continue;   // not due yet, or already reminded today
            }
            boolean active = salarySettingRepository.findByUserId(cycle.getUser().getId())
                    .map(SalarySetting::getActive)
                    .orElse(false);
            if (active) {
                sendReminder(cycle, today);
            }
        }
    }

    private void sendReminder(SalaryCycle cycle, LocalDate today) {
        cycle.setPromptsSent(cycle.getPromptsSent() + 1);
        cycle.setLastPromptedOn(today);

        Notification notification = new Notification();
        notification.setUser(cycle.getUser());
        notification.setType(NotificationType.SALARY_REMINDER);
        notification.setSalaryCycle(cycle);
        notification.setMessage(String.format(
                "Was your salary of ₹%s credited? Confirm to add it to your income. (Reminder %d of %d)",
                cycle.getExpectedAmount().toPlainString(), cycle.getPromptsSent(), TOTAL_REMINDERS));
        notificationRepository.save(notification);
    }

    /** Credit day 31 in a 30-day month becomes the 30th, and so on. */
    private static LocalDate effectiveCreditDate(YearMonth month, int creditDay) {
        return month.atDay(Math.min(creditDay, month.lengthOfMonth()));
    }
}