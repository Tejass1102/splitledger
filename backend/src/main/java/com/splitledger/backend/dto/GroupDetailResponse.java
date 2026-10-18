package com.splitledger.backend.dto;

import java.time.Instant;
import java.util.List;

public record GroupDetailResponse(
        Long id,
        String name,
        Long createdById,
        Instant createdAt,
        List<GroupMemberResponse> members) {}