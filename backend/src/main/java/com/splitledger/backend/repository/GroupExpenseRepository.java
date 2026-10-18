package com.splitledger.backend.repository;

import com.splitledger.backend.entity.GroupExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface GroupExpenseRepository
        extends JpaRepository<GroupExpense, Long>, JpaSpecificationExecutor<GroupExpense> {

    Optional<GroupExpense> findByIdAndGroupId(Long id, Long groupId);

    boolean existsByGroupId(Long groupId);

    boolean existsByPaidById(Long memberId);
}