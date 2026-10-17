package com.splitledger.backend.repository;

import com.splitledger.backend.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface IncomeRepository extends JpaRepository<Income, Long>, JpaSpecificationExecutor<Income> {

    Optional<Income> findByIdAndUserId(Long id, Long userId);

    boolean existsByCategoryId(Long categoryId);
}