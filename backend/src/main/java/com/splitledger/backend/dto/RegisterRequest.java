package com.splitledger.backend.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72) String password) {}