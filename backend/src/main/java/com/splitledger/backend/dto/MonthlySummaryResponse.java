package com.splitledger.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MonthlySummaryResponse(
        String month,          // yyyy-MM
        LocalDate from,
        LocalDate to,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal net) {}