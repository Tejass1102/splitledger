package com.splitledger.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SettlementRequest(
        @NotNull(message = "Payer is required")
        Long fromMemberId,     // the member who handed over the money

        @NotNull(message = "Receiver is required")
        Long toMemberId,       // the member who received it

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 10, fraction = 2, message = "Amount can have at most 10 digits and 2 decimals")
        BigDecimal amount,

        LocalDate settledOn) {}   // optional, defaults to today