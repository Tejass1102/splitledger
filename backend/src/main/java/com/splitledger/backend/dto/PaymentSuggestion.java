package com.splitledger.backend.dto;

import java.math.BigDecimal;

public record PaymentSuggestion(
        Long fromMemberId,
        String fromName,
        Long toMemberId,
        String toName,
        BigDecimal amount) {}