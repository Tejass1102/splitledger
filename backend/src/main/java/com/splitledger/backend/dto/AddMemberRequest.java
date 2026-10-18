package com.splitledger.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

// Exactly one of the two must be given: email = registered user, name = guest.
public record AddMemberRequest(
        @Email(message = "Email is not valid")
        @Size(max = 255, message = "Email can be at most 255 characters")
        String email,

        @Size(max = 100, message = "Name can be at most 100 characters")
        String name) {}