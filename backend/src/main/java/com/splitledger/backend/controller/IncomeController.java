package com.splitledger.backend.controller;

import com.splitledger.backend.dto.IncomeRequest;
import com.splitledger.backend.dto.IncomeResponse;
import com.splitledger.backend.enums.IncomeSource;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.IncomeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/incomes")
@RequiredArgsConstructor
public class IncomeController {
    private final IncomeService incomeService;

    @GetMapping
    public List<IncomeResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) IncomeSource source) {
        return incomeService.list(principal.getId(), from, to, categoryId, source);
    }

    @GetMapping("/{id}")
    public IncomeResponse get(@AuthenticationPrincipal UserPrincipal principal,
                              @PathVariable Long id) {
        return incomeService.get(principal.getId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IncomeResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody IncomeRequest request) {
        return incomeService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public IncomeResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                 @PathVariable Long id,
                                 @Valid @RequestBody IncomeRequest request) {
        return incomeService.update(principal.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        incomeService.delete(principal.getId(), id);
    }
}