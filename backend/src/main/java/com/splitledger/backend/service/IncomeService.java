package com.splitledger.backend.service;

import com.splitledger.backend.dto.IncomeRequest;
import com.splitledger.backend.dto.IncomeResponse;
import com.splitledger.backend.entity.Category;
import com.splitledger.backend.entity.Income;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.enums.IncomeSource;
import com.splitledger.backend.exception.BadRequestException;
import com.splitledger.backend.exception.ConflictException;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.IncomeRepository;
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
public class IncomeService {
    private static final Sort NEWEST_FIRST =
            Sort.by(Sort.Direction.DESC, "incomeDate").and(Sort.by(Sort.Direction.DESC, "id"));

    private final IncomeRepository incomeRepository;
    private final CategoryService categoryService;
    private final UserRepository userRepository;

    @Transactional
    public IncomeResponse create(Long userId, IncomeRequest request) {
        Category category = categoryService.resolveForUse(userId, request.categoryId(), CategoryType.INCOME);

        Income income = new Income();
        income.setUser(userRepository.getReferenceById(userId));
        income.setAmount(request.amount());
        income.setIncomeDate(request.incomeDate());
        income.setCategory(category);
        income.setSourceType(IncomeSource.OTHER);   // SALARY incomes come only from the salary flow
        income.setNote(cleanNote(request.note()));
        incomeRepository.save(income);
        return toResponse(income);
    }

    @Transactional(readOnly = true)
    public List<IncomeResponse> list(Long userId, LocalDate from, LocalDate to,
                                     Long categoryId, IncomeSource source) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("'from' must not be after 'to'");
        }
        return incomeRepository.findAll(filter(userId, from, to, categoryId, source), NEWEST_FIRST).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncomeResponse get(Long userId, Long incomeId) {
        return toResponse(findOwned(userId, incomeId));
    }

    @Transactional
    public IncomeResponse update(Long userId, Long incomeId, IncomeRequest request) {
        Income income = findOwnedManual(userId, incomeId);
        Category category = categoryService.resolveForUse(userId, request.categoryId(), CategoryType.INCOME);

        income.setAmount(request.amount());
        income.setIncomeDate(request.incomeDate());
        income.setCategory(category);
        income.setNote(cleanNote(request.note()));
        return toResponse(income);
    }

    @Transactional
    public void delete(Long userId, Long incomeId) {
        incomeRepository.delete(findOwnedManual(userId, incomeId));
    }

    private Income findOwned(Long userId, Long incomeId) {
        return incomeRepository.findByIdAndUserId(incomeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found"));
    }

    // Same as findOwned, but salary incomes can't be edited or deleted here.
    private Income findOwnedManual(Long userId, Long incomeId) {
        Income income = findOwned(userId, incomeId);
        if (income.getSourceType() == IncomeSource.SALARY) {
            throw new ConflictException("Salary income is managed by the salary confirmation and can't be changed here");
        }
        return income;
    }

    private Specification<Income> filter(Long userId, LocalDate from, LocalDate to,
                                         Long categoryId, IncomeSource source) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("incomeDate"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<LocalDate>get("incomeDate"), to));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (source != null) {
                predicates.add(cb.equal(root.get("sourceType"), source));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String cleanNote(String note) {
        return (note == null || note.isBlank()) ? null : note.trim();
    }

    private IncomeResponse toResponse(Income i) {
        Category c = i.getCategory();
        return new IncomeResponse(
                i.getId(), i.getAmount(), i.getIncomeDate(), i.getSourceType(),
                c == null ? null : c.getId(),
                c == null ? null : c.getName(),
                i.getNote(), i.getCreatedAt());
    }
}