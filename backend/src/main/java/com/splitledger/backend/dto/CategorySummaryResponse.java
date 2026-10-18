package com.splitledger.backend.dto;

import com.splitledger.backend.enums.CategoryType;
import java.math.BigDecimal;
import java.util.List;

public record CategorySummaryResponse(
        String month,          // yyyy-MM
        CategoryType type,
        BigDecimal total,
        List<CategoryBreakdownItem> items) {}