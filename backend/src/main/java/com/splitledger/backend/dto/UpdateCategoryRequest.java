package com.splitledger.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 50, message = "Name can be at most 50 characters")
        String name) {}