package com.splitledger.backend.controller;

import com.splitledger.backend.dto.CategoryRequest;
import com.splitledger.backend.dto.CategoryResponse;
import com.splitledger.backend.dto.UpdateCategoryRequest;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> list(@AuthenticationPrincipal UserPrincipal principal,
                                       @RequestParam(required = false) CategoryType type) {
        return categoryService.list(principal.getId(), type);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                   @Valid @RequestBody CategoryRequest request) {
        return categoryService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public CategoryResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                   @PathVariable Long id,
                                   @Valid @RequestBody UpdateCategoryRequest request) {
        return categoryService.update(principal.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long id) {
        categoryService.delete(principal.getId(), id);
    }
}