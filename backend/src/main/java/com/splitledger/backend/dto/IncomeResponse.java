package com.splitledger.backend.dto;

import com.splitledger.backend.enums.IncomeSource;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record IncomeResponse(
        Long id,
        BigDecimal amount,
        LocalDate incomeDate,
        IncomeSource sourceType,
        Long categoryId,
        String categoryName,
        String note,
        Instant createdAt) {}