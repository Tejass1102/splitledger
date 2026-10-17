package com.splitledger.backend.service;

import com.splitledger.backend.dto.CategoryRequest;
import com.splitledger.backend.dto.CategoryResponse;
import com.splitledger.backend.dto.UpdateCategoryRequest;
import com.splitledger.backend.entity.Category;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.exception.BadRequestException;
import com.splitledger.backend.exception.ConflictException;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.CategoryRepository;
import com.splitledger.backend.repository.ExpenseRepository;
import com.splitledger.backend.repository.IncomeRepository;
import com.splitledger.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(Long userId, CategoryType type) {
        return categoryRepository.findVisible(userId).stream()
                .filter(c -> type == null || c.getType() == type)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest request) {
        String name = request.name().trim();
        ensureNameFree(userId, name, request.type(), null);

        Category category = new Category();
        category.setUser(userRepository.getReferenceById(userId));
        category.setName(name);
        category.setType(request.type());
        categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, UpdateCategoryRequest request) {
        Category category = findOwnedCustom(userId, categoryId);
        String name = request.name().trim();
        ensureNameFree(userId, name, category.getType(), categoryId);
        category.setName(name);
        return toResponse(category);
    }

    @Transactional
    public void delete(Long userId, Long categoryId) {
        Category category = findOwnedCustom(userId, categoryId);
        if (expenseRepository.existsByCategoryId(categoryId)
                || incomeRepository.existsByCategoryId(categoryId)) {
            throw new ConflictException("This category is used by existing entries and can't be deleted");
        }
        categoryRepository.delete(category);
    }

    /**
     * Used by ExpenseService and IncomeService. Returns null when no category was chosen.
     * The category must be visible to the user and match the expected type.
     */
    @Transactional(readOnly = true)
    public Category resolveForUse(Long userId, Long categoryId, CategoryType expectedType) {
        if (categoryId == null) {
            return null;
        }
        Category category = categoryRepository.findVisibleById(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (category.getType() != expectedType) {
            throw new BadRequestException("This entry needs a category of type " + expectedType);
        }
        return category;
    }

    // A category the user can change: visible to them and not a default.
    private Category findOwnedCustom(Long userId, Long categoryId) {
        Category category = categoryRepository.findVisibleById(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (category.getUser() == null) {
            throw new ConflictException("Default categories can't be changed or deleted");
        }
        return category;
    }

    private void ensureNameFree(Long userId, String name, CategoryType type, Long excludeId) {
        if (categoryRepository.existsByUserIsNullAndNameIgnoreCaseAndType(name, type)) {
            throw new ConflictException("A default category named '" + name + "' already exists");
        }
        boolean mine = (excludeId == null)
                ? categoryRepository.existsByUserIdAndNameIgnoreCaseAndType(userId, name, type)
                : categoryRepository.existsByUserIdAndNameIgnoreCaseAndTypeAndIdNot(userId, name, type, excludeId);
        if (mine) {
            throw new ConflictException("You already have a category named '" + name + "'");
        }
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getType(), c.getUser() == null);
    }
}