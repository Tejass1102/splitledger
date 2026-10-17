package com.splitledger.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

public record ConfirmSalaryRequest(
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 10, fraction = 2, message = "Amount can have at most 10 digits and 2 decimals")
        BigDecimal amount) {}