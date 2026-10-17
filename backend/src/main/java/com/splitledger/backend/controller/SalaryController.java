package com.splitledger.backend.controller;

import com.splitledger.backend.dto.ConfirmSalaryRequest;
import com.splitledger.backend.dto.SalaryCycleResponse;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.SalaryCycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/salary")
@RequiredArgsConstructor
public class SalaryController {
    private final SalaryCycleService salaryCycleService;

    @GetMapping("/pending")
    public List<SalaryCycleResponse> pending(@AuthenticationPrincipal UserPrincipal principal) {
        return salaryCycleService.getPending(principal.getId());
    }

    @PostMapping("/cycles/{id}/confirm")
    public SalaryCycleResponse confirm(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long id,
                                       @Valid @RequestBody(required = false) ConfirmSalaryRequest request) {
        return salaryCycleService.confirm(principal.getId(), id, request);
    }
}