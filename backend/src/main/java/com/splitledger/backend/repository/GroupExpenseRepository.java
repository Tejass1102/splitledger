package com.splitledger.backend.repository;

import com.splitledger.backend.dto.MemberAmount;
import com.splitledger.backend.entity.GroupExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface GroupExpenseRepository
        extends JpaRepository<GroupExpense, Long>, JpaSpecificationExecutor<GroupExpense> {

    Optional<GroupExpense> findByIdAndGroupId(Long id, Long groupId);

    boolean existsByGroupId(Long groupId);

    boolean existsByPaidById(Long memberId);

    // What each member paid in this group (members who paid nothing are not in the result)
    @Query("select new com.splitledger.backend.dto.MemberAmount(e.paidBy.id, sum(e.amount)) "
            + "from GroupExpense e where e.group.id = :groupId group by e.paidBy.id")
    List<MemberAmount> sumPaidByMember(@Param("groupId") Long groupId);
}