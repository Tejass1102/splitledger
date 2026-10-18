package com.splitledger.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SettlementResponse(
        Long id,
        Long groupId,
        Long fromMemberId,
        String fromName,
        Long toMemberId,
        String toName,
        BigDecimal amount,
        LocalDate settledOn) {}