package com.splitledger.backend.controller;

import com.splitledger.backend.dto.NotificationResponse;
import com.splitledger.backend.dto.UnreadCountResponse;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal UserPrincipal principal,
                                           @RequestParam(defaultValue = "false") boolean unreadOnly) {
        return notificationService.list(principal.getId(), unreadOnly);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.unreadCount(principal.getId());
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long id) {
        return notificationService.markRead(principal.getId(), id);
    }
}