package com.splitledger.backend.dto;

import java.math.BigDecimal;

public record CategoryTotal(Long categoryId, String categoryName, BigDecimal total) {}