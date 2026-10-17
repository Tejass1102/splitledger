package com.splitledger.backend.service;

import com.splitledger.backend.config.DefaultCategorySeeder;
import com.splitledger.backend.dto.ConfirmSalaryRequest;
import com.splitledger.backend.dto.SalaryCycleResponse;
import com.splitledger.backend.entity.Income;
import com.splitledger.backend.entity.SalaryCycle;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.enums.IncomeSource;
import com.splitledger.backend.enums.SalaryCycleStatus;
import com.splitledger.backend.exception.ConflictException;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.CategoryRepository;
import com.splitledger.backend.repository.IncomeRepository;
import com.splitledger.backend.repository.NotificationRepository;
import com.splitledger.backend.repository.SalaryCycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SalaryCycleService {
    private static final DateTimeFormatter MONTH_FORMAT =
            DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    private final SalaryCycleRepository salaryCycleRepository;
    private final IncomeRepository incomeRepository;
    private final NotificationRepository notificationRepository;
    private final CategoryRepository categoryRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<SalaryCycleResponse> getPending(Long userId) {
        return salaryCycleRepository
                .findByUserIdAndStatusOrderByCreditDateDesc(userId, SalaryCycleStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SalaryCycleResponse confirm(Long userId, Long cycleId, ConfirmSalaryRequest request) {
        SalaryCycle cycle = salaryCycleRepository.findByIdAndUserIdForUpdate(cycleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Salary cycle not found"));

        if (cycle.getStatus() != SalaryCycleStatus.PENDING) {
            throw new ConflictException("This salary is already "
                    + cycle.getStatus().name().toLowerCase() + " and can't be confirmed");
        }

        BigDecimal amount = (request != null && request.amount() != null)
                ? request.amount()
                : cycle.getExpectedAmount();

        Income income = new Income();
        income.setUser(cycle.getUser());
        income.setAmount(amount);
        income.setIncomeDate(LocalDate.now(clock));
        income.setSourceType(IncomeSource.SALARY);
        income.setNote("Salary for " + cycle.getMonth().format(MONTH_FORMAT));
        // Link the default "Salary" category (seeded at startup); stays null if it is somehow missing.
        categoryRepository
                .findFirstByUserIsNullAndNameIgnoreCaseAndType(
                        DefaultCategorySeeder.SALARY_CATEGORY_NAME, CategoryType.INCOME)
                .ifPresent(income::setCategory);
        incomeRepository.save(income);

        cycle.setStatus(SalaryCycleStatus.CONFIRMED);
        cycle.setConfirmedAt(Instant.now(clock));
        cycle.setIncome(income);

        // The question has been answered, so its reminders no longer need attention.
        notificationRepository.findBySalaryCycleId(cycleId).forEach(n -> n.setRead(true));

        return toResponse(cycle);
    }

    private SalaryCycleResponse toResponse(SalaryCycle c) {
        return new SalaryCycleResponse(
                c.getId(), c.getMonth(), c.getCreditDate(), c.getExpectedAmount(),
                c.getStatus(), c.getPromptsSent(),
                c.getIncome() == null ? null : c.getIncome().getId());
    }
}