package com.splitledger.backend.service;

import com.splitledger.backend.dto.ExpenseRequest;
import com.splitledger.backend.dto.ExpenseResponse;
import com.splitledger.backend.entity.Category;
import com.splitledger.backend.entity.Expense;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.exception.BadRequestException;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.ExpenseRepository;
import com.splitledger.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    private static final Sort NEWEST_FIRST =
            Sort.by(Sort.Direction.DESC, "expenseDate").and(Sort.by(Sort.Direction.DESC, "id"));

    private final ExpenseRepository expenseRepository;
    private final CategoryService categoryService;
    private final UserRepository userRepository;

    @Transactional
    public ExpenseResponse create(Long userId, ExpenseRequest request) {
        Category category = categoryService.resolveForUse(userId, request.categoryId(), CategoryType.EXPENSE);

        Expense expense = new Expense();
        expense.setUser(userRepository.getReferenceById(userId));
        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setCategory(category);
        expense.setNote(cleanNote(request.note()));
        expenseRepository.save(expense);
        return toResponse(expense);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(Long userId, LocalDate from, LocalDate to, Long categoryId) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("'from' must not be after 'to'");
        }
        return expenseRepository.findAll(filter(userId, from, to, categoryId), NEWEST_FIRST).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExpenseResponse get(Long userId, Long expenseId) {
        return toResponse(findOwned(userId, expenseId));
    }

    @Transactional
    public ExpenseResponse update(Long userId, Long expenseId, ExpenseRequest request) {
        Expense expense = findOwned(userId, expenseId);
        Category category = categoryService.resolveForUse(userId, request.categoryId(), CategoryType.EXPENSE);

        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setCategory(category);
        expense.setNote(cleanNote(request.note()));
        return toResponse(expense);
    }

    @Transactional
    public void delete(Long userId, Long expenseId) {
        expenseRepository.delete(findOwned(userId, expenseId));
    }

    private Expense findOwned(Long userId, Long expenseId) {
        return expenseRepository.findByIdAndUserId(expenseId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
    }

    // The user condition is always added; the others only when the filter was given.
    private Specification<Expense> filter(Long userId, LocalDate from, LocalDate to, Long categoryId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("expenseDate"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<LocalDate>get("expenseDate"), to));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String cleanNote(String note) {
        return (note == null || note.isBlank()) ? null : note.trim();
    }

    private ExpenseResponse toResponse(Expense e) {
        Category c = e.getCategory();
        return new ExpenseResponse(
                e.getId(), e.getAmount(), e.getExpenseDate(),
                c == null ? null : c.getId(),
                c == null ? null : c.getName(),
                e.getNote(), e.getCreatedAt());
    }
}