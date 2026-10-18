package com.splitledger.backend.controller;

import com.splitledger.backend.dto.GroupExpenseRequest;
import com.splitledger.backend.dto.GroupExpenseResponse;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.GroupExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/expenses")
@RequiredArgsConstructor
public class GroupExpenseController {
    private final GroupExpenseService groupExpenseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupExpenseResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long groupId,
                                       @Valid @RequestBody GroupExpenseRequest request) {
        return groupExpenseService.create(principal.getId(), groupId, request);
    }

    @GetMapping
    public List<GroupExpenseResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long paidByMemberId) {
        return groupExpenseService.list(principal.getId(), groupId, from, to, paidByMemberId);
    }

    @GetMapping("/{expenseId}")
    public GroupExpenseResponse get(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long groupId,
                                    @PathVariable Long expenseId) {
        return groupExpenseService.get(principal.getId(), groupId, expenseId);
    }

    @PutMapping("/{expenseId}")
    public GroupExpenseResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long groupId,
                                       @PathVariable Long expenseId,
                                       @Valid @RequestBody GroupExpenseRequest request) {
        return groupExpenseService.update(principal.getId(), groupId, expenseId, request);
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long groupId,
                       @PathVariable Long expenseId) {
        groupExpenseService.delete(principal.getId(), groupId, expenseId);
    }
}