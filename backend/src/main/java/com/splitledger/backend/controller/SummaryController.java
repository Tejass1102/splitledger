package com.splitledger.backend.controller;

import com.splitledger.backend.dto.BalanceResponse;
import com.splitledger.backend.dto.CategorySummaryResponse;
import com.splitledger.backend.dto.MonthlySummaryResponse;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.SummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.time.YearMonth;

@RestController
@RequestMapping("/api/summary")
@RequiredArgsConstructor
public class SummaryController {
    private final SummaryService summaryService;

    @GetMapping("/monthly")
    public MonthlySummaryResponse monthly(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return summaryService.monthly(principal.getId(), month);
    }

    @GetMapping("/categories")
    public CategorySummaryResponse categories(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month,
            @RequestParam(defaultValue = "EXPENSE") CategoryType type) {
        return summaryService.categories(principal.getId(), month, type);
    }

    @GetMapping("/balance")
    public BalanceResponse balance(@AuthenticationPrincipal UserPrincipal principal) {
        return summaryService.balance(principal.getId());
    }
}