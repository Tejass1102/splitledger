package com.splitledger.backend.service;

import com.splitledger.backend.dto.BalanceResponse;
import com.splitledger.backend.dto.CategoryBreakdownItem;
import com.splitledger.backend.dto.CategorySummaryResponse;
import com.splitledger.backend.dto.CategoryTotal;
import com.splitledger.backend.dto.MonthlySummaryResponse;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.repository.ExpenseRepository;
import com.splitledger.backend.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SummaryService {
    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final String UNCATEGORIZED = "Uncategorized";

    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public MonthlySummaryResponse monthly(Long userId, YearMonth month) {
        YearMonth m = resolve(month);
        LocalDate from = m.atDay(1);
        LocalDate to = m.atEndOfMonth();

        BigDecimal income = orZero(incomeRepository.sumBetween(userId, from, to));
        BigDecimal expense = orZero(expenseRepository.sumBetween(userId, from, to));
        return new MonthlySummaryResponse(m.toString(), from, to, income, expense, income.subtract(expense));
    }

    @Transactional(readOnly = true)
    public CategorySummaryResponse categories(Long userId, YearMonth month, CategoryType type) {
        YearMonth m = resolve(month);
        LocalDate from = m.atDay(1);
        LocalDate to = m.atEndOfMonth();

        List<CategoryTotal> totals = (type == CategoryType.EXPENSE)
                ? expenseRepository.categoryTotals(userId, from, to)
                : incomeRepository.categoryTotals(userId, from, to);

        BigDecimal total = totals.stream()
                .map(CategoryTotal::total)
                .reduce(ZERO, BigDecimal::add);

        List<CategoryBreakdownItem> items = totals.stream()
                .map(t -> new CategoryBreakdownItem(
                        t.categoryId(),
                        t.categoryName() == null ? UNCATEGORIZED : t.categoryName(),
                        t.total(),
                        percentage(t.total(), total)))
                .toList();

        return new CategorySummaryResponse(m.toString(), type, total, items);
    }

    @Transactional(readOnly = true)
    public BalanceResponse balance(Long userId) {
        BigDecimal income = orZero(incomeRepository.sumAll(userId));
        BigDecimal expense = orZero(expenseRepository.sumAll(userId));
        return new BalanceResponse(income, expense, income.subtract(expense));
    }

    // "Current month" always comes from the Clock bean (Asia/Kolkata), as with every other "today".
    private YearMonth resolve(YearMonth month) {
        return month != null ? month : YearMonth.now(clock);
    }

    private BigDecimal orZero(BigDecimal value) {
        return value == null ? ZERO : value;
    }

    private BigDecimal percentage(BigDecimal part, BigDecimal total) {
        if (total.signum() == 0) {
            return ZERO;
        }
        return part.multiply(HUNDRED).divide(total, 2, RoundingMode.HALF_UP);
    }
}