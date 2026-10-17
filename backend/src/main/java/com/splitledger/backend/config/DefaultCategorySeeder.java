package com.splitledger.backend.config;

import com.splitledger.backend.entity.Category;
import com.splitledger.backend.enums.CategoryType;
import com.splitledger.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

/**
 * Inserts the default categories (user = null) that are missing.
 * Runs before ApplicationReadyEvent, so it finishes before the salary job's startup run.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DefaultCategorySeeder implements CommandLineRunner {
    public static final String SALARY_CATEGORY_NAME = "Salary";

    private static final List<String> EXPENSE_DEFAULTS = List.of(
            "Food", "Groceries", "Shopping", "Travel", "Bills",
            "Rent", "Entertainment", "Health", "Education", "Other");

    private static final List<String> INCOME_DEFAULTS = List.of(
            SALARY_CATEGORY_NAME, "Freelance", "Gift", "Interest", "Other");

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        int created = seed(EXPENSE_DEFAULTS, CategoryType.EXPENSE)
                + seed(INCOME_DEFAULTS, CategoryType.INCOME);
        if (created > 0) {
            log.info("Seeded {} default categories", created);
        }
    }

    private int seed(List<String> names, CategoryType type) {
        int created = 0;
        for (String name : names) {
            if (!categoryRepository.existsByUserIsNullAndNameIgnoreCaseAndType(name, type)) {
                Category category = new Category();   // user stays null = default
                category.setName(name);
                category.setType(type);
                categoryRepository.save(category);
                created++;
            }
        }
        return created;
    }
}