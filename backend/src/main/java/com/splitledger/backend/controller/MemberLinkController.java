package com.splitledger.backend.controller;

import com.splitledger.backend.dto.GroupMemberResponse;
import com.splitledger.backend.dto.LinkMemberRequest;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.MemberLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups/{groupId}/members/{memberId}")
@RequiredArgsConstructor
public class MemberLinkController {
    private final MemberLinkService memberLinkService;

    @PostMapping("/link")
    public GroupMemberResponse link(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long groupId,
                                    @PathVariable Long memberId,
                                    @Valid @RequestBody LinkMemberRequest request) {
        return memberLinkService.link(principal.getId(), groupId, memberId, request);
    }
}