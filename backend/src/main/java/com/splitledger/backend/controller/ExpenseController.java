package com.splitledger.backend.controller;

import com.splitledger.backend.dto.ExpenseRequest;
import com.splitledger.backend.dto.ExpenseResponse;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {
    private final ExpenseService expenseService;

    @GetMapping
    public List<ExpenseResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long categoryId) {
        return expenseService.list(principal.getId(), from, to, categoryId);
    }

    @GetMapping("/{id}")
    public ExpenseResponse get(@AuthenticationPrincipal UserPrincipal principal,
                               @PathVariable Long id) {
        return expenseService.get(principal.getId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                  @Valid @RequestBody ExpenseRequest request) {
        return expenseService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                  @PathVariable Long id,
                                  @Valid @RequestBody ExpenseRequest request) {
        return expenseService.update(principal.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        expenseService.delete(principal.getId(), id);
    }
}