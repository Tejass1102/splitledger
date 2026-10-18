package com.splitledger.backend.controller;

import com.splitledger.backend.dto.AddMemberRequest;
import com.splitledger.backend.dto.GroupDetailResponse;
import com.splitledger.backend.dto.GroupMemberResponse;
import com.splitledger.backend.dto.GroupRequest;
import com.splitledger.backend.dto.GroupResponse;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupDetailResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                      @Valid @RequestBody GroupRequest request) {
        return groupService.create(principal.getId(), request);
    }

    @GetMapping
    public List<GroupResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return groupService.list(principal.getId());
    }

    @GetMapping("/{groupId}")
    public GroupDetailResponse get(@AuthenticationPrincipal UserPrincipal principal,
                                   @PathVariable Long groupId) {
        return groupService.get(principal.getId(), groupId);
    }

    @PutMapping("/{groupId}")
    public GroupDetailResponse rename(@AuthenticationPrincipal UserPrincipal principal,
                                      @PathVariable Long groupId,
                                      @Valid @RequestBody GroupRequest request) {
        return groupService.rename(principal.getId(), groupId, request);
    }

    @DeleteMapping("/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long groupId) {
        groupService.delete(principal.getId(), groupId);
    }

    @GetMapping("/{groupId}/members")
    public List<GroupMemberResponse> listMembers(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable Long groupId) {
        return groupService.listMembers(principal.getId(), groupId);
    }

    @PostMapping("/{groupId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public GroupMemberResponse addMember(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long groupId,
                                         @Valid @RequestBody AddMemberRequest request) {
        return groupService.addMember(principal.getId(), groupId, request);
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@AuthenticationPrincipal UserPrincipal principal,
                             @PathVariable Long groupId,
                             @PathVariable Long memberId) {
        groupService.removeMember(principal.getId(), groupId, memberId);
    }
}