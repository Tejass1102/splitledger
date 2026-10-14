package com.splitledger.backend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record SalarySettingRequest(
        @NotNull
        @DecimalMin(value = "0.01", message = "Salary must be greater than 0")
        @Digits(integer = 10, fraction = 2, message = "Salary can have at most 10 digits and 2 decimals")
        BigDecimal amount,

        @NotNull
        @Min(value = 1, message = "Credit day must be between 1 and 31")
        @Max(value = 31, message = "Credit day must be between 1 and 31")
        Integer creditDay,

        Boolean active) {}   // optional, defaults to true