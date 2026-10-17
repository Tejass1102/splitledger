package com.splitledger.backend.dto;

import com.splitledger.backend.enums.NotificationType;
import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String message,
        Boolean read,
        Long salaryCycleId,
        Instant createdAt) {}