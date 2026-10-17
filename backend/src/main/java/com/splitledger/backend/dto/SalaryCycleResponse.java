package com.splitledger.backend.dto;

import com.splitledger.backend.enums.SalaryCycleStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SalaryCycleResponse(
        Long id,
        LocalDate month,
        LocalDate creditDate,
        BigDecimal expectedAmount,
        SalaryCycleStatus status,
        Integer promptsSent,
        Long incomeId) {}