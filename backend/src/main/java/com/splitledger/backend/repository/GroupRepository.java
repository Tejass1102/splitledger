package com.splitledger.backend.repository;

import com.splitledger.backend.entity.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<ExpenseGroup, Long> {

    // Only groups in which the user is a member
    @Query("select g from ExpenseGroup g "
            + "where exists (select 1 from GroupMember m where m.group = g and m.user.id = :userId) "
            + "order by g.createdAt desc, g.id desc")
    List<ExpenseGroup> findVisible(@Param("userId") Long userId);

    @Query("select g from ExpenseGroup g "
            + "where g.id = :id "
            + "and exists (select 1 from GroupMember m where m.group = g and m.user.id = :userId)")
    Optional<ExpenseGroup> findVisibleById(@Param("id") Long id, @Param("userId") Long userId);
}