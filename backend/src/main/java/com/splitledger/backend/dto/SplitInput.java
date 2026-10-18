package com.splitledger.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

// value: EQUAL = must be omitted, EXACT = the rupee amount, PERCENTAGE = the percentage
public record SplitInput(
        @NotNull(message = "Member id is required")
        Long memberId,

        @DecimalMin(value = "0.01", message = "Value must be greater than 0")
        @Digits(integer = 10, fraction = 2, message = "Value can have at most 10 digits and 2 decimals")
        BigDecimal value) {}