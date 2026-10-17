package com.splitledger.backend.service;

import com.splitledger.backend.dto.NotificationResponse;
import com.splitledger.backend.dto.UnreadCountResponse;
import com.splitledger.backend.entity.Notification;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Long userId, boolean unreadOnly) {
        List<Notification> items = unreadOnly
                ? notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return items.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount(Long userId) {
        return new UnreadCountResponse(notificationRepository.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        return toResponse(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getMessage(), n.getRead(),
                n.getSalaryCycle() == null ? null : n.getSalaryCycle().getId(),
                n.getCreatedAt());
    }
}