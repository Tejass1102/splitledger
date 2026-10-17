package com.splitledger.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ExpenseResponse(
        Long id,
        BigDecimal amount,
        LocalDate expenseDate,
        Long categoryId,
        String categoryName,
        String note,
        Instant createdAt) {}