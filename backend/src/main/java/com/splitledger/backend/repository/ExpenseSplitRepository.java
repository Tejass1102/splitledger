package com.splitledger.backend.repository;

import com.splitledger.backend.dto.MemberAmount;
import com.splitledger.backend.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;

public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    // One query for the shares of many expenses, with the member loaded
    @Query("select s from ExpenseSplit s join fetch s.member "
            + "where s.groupExpense.id in :expenseIds order by s.id")
    List<ExpenseSplit> findByExpenseIds(@Param("expenseIds") Collection<Long> expenseIds);

    void deleteByGroupExpenseId(Long groupExpenseId);

    boolean existsByMemberId(Long memberId);

    // What each member owes in total across this group's expenses
    @Query("select new com.splitledger.backend.dto.MemberAmount(s.member.id, sum(s.shareAmount)) "
            + "from ExpenseSplit s where s.groupExpense.group.id = :groupId group by s.member.id")
    List<MemberAmount> sumSharesByMember(@Param("groupId") Long groupId);
}