package com.splitledger.backend.controller;

import com.splitledger.backend.dto.GroupBalanceResponse;
import com.splitledger.backend.dto.SettleUpResponse;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups/{groupId}")
@RequiredArgsConstructor
public class BalanceController {
    private final BalanceService balanceService;

    @GetMapping("/balances")
    public GroupBalanceResponse balances(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long groupId) {
        return balanceService.balances(principal.getId(), groupId);
    }

    @GetMapping("/settle-up")
    public SettleUpResponse settleUp(@AuthenticationPrincipal UserPrincipal principal,
                                     @PathVariable Long groupId) {
        return balanceService.settleUp(principal.getId(), groupId);
    }
}