package com.splitledger.backend.dto;

import jakarta.validation.constraints.*;

public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email is not valid")
        @Size(max = 255, message = "Email can be at most 255 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(max = 72, message = "Password is too long")
        String password) {}