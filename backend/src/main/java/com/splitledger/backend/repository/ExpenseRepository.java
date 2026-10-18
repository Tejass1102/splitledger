package com.splitledger.backend.repository;

import com.splitledger.backend.dto.CategoryTotal;
import com.splitledger.backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {

    Optional<Expense> findByIdAndUserId(Long id, Long userId);

    boolean existsByCategoryId(Long categoryId);

    // sum() is null when there are no rows; the service turns that into 0.00
    @Query("select sum(e.amount) from Expense e "
            + "where e.user.id = :userId and e.expenseDate >= :from and e.expenseDate <= :to")
    BigDecimal sumBetween(@Param("userId") Long userId,
                          @Param("from") LocalDate from,
                          @Param("to") LocalDate to);

    @Query("select sum(e.amount) from Expense e where e.user.id = :userId")
    BigDecimal sumAll(@Param("userId") Long userId);

    @Query("select new com.splitledger.backend.dto.CategoryTotal(c.id, c.name, sum(e.amount)) "
            + "from Expense e left join e.category c "
            + "where e.user.id = :userId and e.expenseDate >= :from and e.expenseDate <= :to "
            + "group by c.id, c.name "
            + "order by sum(e.amount) desc")
    List<CategoryTotal> categoryTotals(@Param("userId") Long userId,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);
}