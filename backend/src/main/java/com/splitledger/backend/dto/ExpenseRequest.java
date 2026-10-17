package com.splitledger.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 10, fraction = 2, message = "Amount can have at most 10 digits and 2 decimals")
        BigDecimal amount,

        @NotNull(message = "Date is required")
        LocalDate expenseDate,

        Long categoryId,   // optional

        @Size(max = 255, message = "Note can be at most 255 characters")
        String note) {}