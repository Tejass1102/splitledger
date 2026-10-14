package com.splitledger.backend.dto;

import java.math.BigDecimal;

public record SalarySettingResponse(BigDecimal amount, Integer creditDay, Boolean active) {}