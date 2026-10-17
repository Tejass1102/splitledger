package com.splitledger.backend.dto;

import com.splitledger.backend.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 50, message = "Name can be at most 50 characters")
        String name,

        @NotNull(message = "Type is required (EXPENSE or INCOME)")
        CategoryType type) {}