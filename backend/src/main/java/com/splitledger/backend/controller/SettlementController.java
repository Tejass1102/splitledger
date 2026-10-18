package com.splitledger.backend.controller;

import com.splitledger.backend.dto.SettlementRequest;
import com.splitledger.backend.dto.SettlementResponse;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/settlements")
@RequiredArgsConstructor
public class SettlementController {
    private final SettlementService settlementService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SettlementResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                     @PathVariable Long groupId,
                                     @Valid @RequestBody SettlementRequest request) {
        return settlementService.create(principal.getId(), groupId, request);
    }

    @GetMapping
    public List<SettlementResponse> list(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long groupId) {
        return settlementService.list(principal.getId(), groupId);
    }

    @DeleteMapping("/{settlementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long groupId,
                       @PathVariable Long settlementId) {
        settlementService.delete(principal.getId(), groupId, settlementId);
    }
}