package com.splitledger.backend.repository;

import com.splitledger.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    List<Notification> findBySalaryCycleId(Long salaryCycleId);
    long countByUserIdAndReadFalse(Long userId);
}