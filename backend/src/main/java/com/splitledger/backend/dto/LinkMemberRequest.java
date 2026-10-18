package com.splitledger.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LinkMemberRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email is not valid")
        @Size(max = 255, message = "Email can be at most 255 characters")
        String email) {}