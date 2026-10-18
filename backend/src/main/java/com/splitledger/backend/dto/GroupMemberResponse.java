package com.splitledger.backend.dto;

public record GroupMemberResponse(
        Long id,               // the member id (what splits and settlements will point to)
        String displayName,
        Long userId,           // null for a guest
        boolean guest) {}