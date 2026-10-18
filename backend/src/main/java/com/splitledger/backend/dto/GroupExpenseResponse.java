package com.splitledger.backend.dto;

import com.splitledger.backend.enums.SplitType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record GroupExpenseResponse(
        Long id,
        Long groupId,
        String description,
        BigDecimal amount,
        LocalDate expenseDate,
        SplitType splitType,
        Long paidByMemberId,
        String paidByName,
        Long createdById,
        List<SplitShareResponse> splits) {}