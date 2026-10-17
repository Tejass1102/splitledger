package com.splitledger.backend.repository;

import com.splitledger.backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {

    Optional<Expense> findByIdAndUserId(Long id, Long userId);

    boolean existsByCategoryId(Long categoryId);
}