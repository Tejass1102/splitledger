package com.splitledger.backend.dto;

import java.time.Instant;

public record GroupResponse(
        Long id,
        String name,
        Long createdById,
        Instant createdAt,
        long memberCount) {}