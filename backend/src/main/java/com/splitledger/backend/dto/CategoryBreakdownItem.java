package com.splitledger.backend.dto;

import java.math.BigDecimal;

public record CategoryBreakdownItem(
        Long categoryId,       // null for "Uncategorized"
        String categoryName,
        BigDecimal amount,
        BigDecimal percentage) {}