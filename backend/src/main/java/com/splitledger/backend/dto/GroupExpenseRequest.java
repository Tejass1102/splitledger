package com.splitledger.backend.dto;

import com.splitledger.backend.enums.SplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record GroupExpenseRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 10, fraction = 2, message = "Amount can have at most 10 digits and 2 decimals")
        BigDecimal amount,

        @NotNull(message = "Date is required")
        LocalDate expenseDate,

        @NotBlank(message = "Description is required")
        @Size(max = 255, message = "Description can be at most 255 characters")
        String description,

        @NotNull(message = "Payer is required")
        Long paidByMemberId,

        @NotNull(message = "Split type is required (EQUAL, EXACT or PERCENTAGE)")
        SplitType splitType,

        @NotEmpty(message = "At least one member is needed in the split")
        @Size(max = 100, message = "A split can have at most 100 members")
        @Valid
        List<SplitInput> splits) {}