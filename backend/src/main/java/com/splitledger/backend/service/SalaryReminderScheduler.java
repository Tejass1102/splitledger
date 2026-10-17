package com.splitledger.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.Clock;
import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class SalaryReminderScheduler {
    private final SalaryReminderService reminderService;
    private final Clock clock;

    @Scheduled(cron = "${app.salary-reminder.cron}", zone = "${app.timezone}")
    public void run() {
        LocalDate today = LocalDate.now(clock);
        try {
            log.info("Running salary reminder job for {}", today);
            reminderService.processReminders(today);
        } catch (Exception e) {
            log.error("Salary reminder job failed", e);
        }
    }

    /** Catch-up run: covers a day when the app wasn't running at 9:00. Safe because the job is idempotent. */
    @EventListener(ApplicationReadyEvent.class)
    public void runOnStartup() {
        run();
    }
}