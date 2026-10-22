package com.splitledger.backend.service;

import com.splitledger.backend.dto.BalanceResponse;
import com.splitledger.backend.dto.CategoryBreakdownItem;
import com.splitledger.backend.dto.CategorySummaryResponse;
import com.splitledger.backend.dto.CategoryTotal;
import com.splitledger.backend.dto.MonthlySummaryResponse;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.repository.ExpenseRepository;
import com.splitledger.backend.repository.IncomeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SummaryServiceTest {
    private static final Long USER_ID = 1L;

    @Mock ExpenseRepository expenseRepository;
    @Mock IncomeRepository incomeRepository;

    private SummaryService service;

    @BeforeEach
    void setUp() {
        // 20:00 UTC on 30 September is already 1 October in Asia/Kolkata
        Clock clock = Clock.fixed(Instant.parse("2026-09-30T20:00:00Z"), ZoneId.of("Asia/Kolkata"));
        service = new SummaryService(expenseRepository, incomeRepository, clock);
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    @Test
    void monthlySummaryDefaultsToTheCurrentMonthInTheClockTimezone() {
        when(incomeRepository.sumBetween(USER_ID, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31)))
                .thenReturn(bd("1000.00"));

        MonthlySummaryResponse result = service.monthly(USER_ID, null);

        assertThat(result.month()).isEqualTo("2026-10");
        assertThat(result.from()).isEqualTo(LocalDate.of(2026, 10, 1));
        assertThat(result.to()).isEqualTo(LocalDate.of(2026, 10, 31));
        assertThat(result.totalIncome()).isEqualByComparingTo("1000.00");
        assertThat(result.totalExpense()).isEqualByComparingTo("0.00");
        assertThat(result.net()).isEqualByComparingTo("1000.00");
    }

    @Test
    void monthlySummaryUsesTheRealLastDayOfTheMonth() {
        when(incomeRepository.sumBetween(USER_ID, LocalDate.of(2028, 2, 1), LocalDate.of(2028, 2, 29)))
                .thenReturn(bd("500.00"));
        when(expenseRepository.sumBetween(USER_ID, LocalDate.of(2028, 2, 1), LocalDate.of(2028, 2, 29)))
                .thenReturn(bd("120.25"));

        MonthlySummaryResponse result = service.monthly(USER_ID, YearMonth.of(2028, 2));

        assertThat(result.to()).isEqualTo(LocalDate.of(2028, 2, 29));
        assertThat(result.totalIncome()).isEqualByComparingTo("500.00");
        assertThat(result.totalExpense()).isEqualByComparingTo("120.25");
        assertThat(result.net()).isEqualByComparingTo("379.75");
    }

    @Test
    void aMonthWithNoDataGivesZerosNotAnError() {
        MonthlySummaryResponse result = service.monthly(USER_ID, YearMonth.of(2020, 1));

        assertThat(result.totalIncome()).isEqualByComparingTo("0.00");
        assertThat(result.totalExpense()).isEqualByComparingTo("0.00");
        assertThat(result.net()).isEqualByComparingTo("0.00");
    }

    @Test
    void expenseBreakdownHasPercentagesAndAnUncategorizedItem() {
        when(expenseRepository.categoryTotals(USER_ID, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new CategoryTotal(2L, "Travel", bd("2000.00")),
                        new CategoryTotal(1L, "Food", bd("1500.50")),
                        new CategoryTotal(null, null, bd("99.50"))));

        CategorySummaryResponse result =
                service.categories(USER_ID, YearMonth.of(2026, 9), CategoryType.EXPENSE);

        assertThat(result.type()).isEqualTo(CategoryType.EXPENSE);
        assertThat(result.total()).isEqualByComparingTo("3600.00");
        assertThat(result.items()).extracting(CategoryBreakdownItem::categoryName)
                .containsExactly("Travel", "Food", "Uncategorized");
        assertThat(result.items()).extracting(CategoryBreakdownItem::percentage)
                .containsExactly(bd("55.56"), bd("41.68"), bd("2.76"));
        assertThat(result.items().get(2).categoryId()).isNull();
    }

    @Test
    void incomeBreakdownReadsTheIncomeTableOnly() {
        when(incomeRepository.categoryTotals(USER_ID, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(
                        new CategoryTotal(5L, "Freelance", bd("5000.00")),
                        new CategoryTotal(null, null, bd("1500.25"))));

        CategorySummaryResponse result =
                service.categories(USER_ID, YearMonth.of(2026, 9), CategoryType.INCOME);

        assertThat(result.type()).isEqualTo(CategoryType.INCOME);
        assertThat(result.total()).isEqualByComparingTo("6500.25");
        assertThat(result.items()).extracting(CategoryBreakdownItem::percentage)
                .containsExactly(bd("76.92"), bd("23.08"));
        verifyNoInteractions(expenseRepository);
    }

    @Test
    void aBreakdownWithNoDataHasAZeroTotalAndNoItems() {
        CategorySummaryResponse result =
                service.categories(USER_ID, YearMonth.of(2020, 1), CategoryType.EXPENSE);

        assertThat(result.total()).isEqualByComparingTo("0.00");
        assertThat(result.items()).isEmpty();
    }

    @Test
    void balanceIsAllTimeIncomeMinusAllTimeExpenses() {
        when(incomeRepository.sumAll(USER_ID)).thenReturn(bd("6500.25"));
        when(expenseRepository.sumAll(USER_ID)).thenReturn(bd("3600.00"));

        BalanceResponse result = service.balance(USER_ID);

        assertThat(result.totalIncome()).isEqualByComparingTo("6500.25");
        assertThat(result.totalExpense()).isEqualByComparingTo("3600.00");
        assertThat(result.balance()).isEqualByComparingTo("2900.25");
    }

    @Test
    void balanceOfAUserWithNoEntriesIsZero() {
        BalanceResponse result = service.balance(USER_ID);

        assertThat(result.totalIncome()).isEqualByComparingTo("0.00");
        assertThat(result.totalExpense()).isEqualByComparingTo("0.00");
        assertThat(result.balance()).isEqualByComparingTo("0.00");
    }
}