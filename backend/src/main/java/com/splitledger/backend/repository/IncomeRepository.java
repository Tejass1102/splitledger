package com.splitledger.backend.repository;

import com.splitledger.backend.dto.CategoryTotal;
import com.splitledger.backend.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IncomeRepository extends JpaRepository<Income, Long>, JpaSpecificationExecutor<Income> {

    Optional<Income> findByIdAndUserId(Long id, Long userId);

    boolean existsByCategoryId(Long categoryId);

    @Query("select sum(i.amount) from Income i "
            + "where i.user.id = :userId and i.incomeDate >= :from and i.incomeDate <= :to")
    BigDecimal sumBetween(@Param("userId") Long userId,
                          @Param("from") LocalDate from,
                          @Param("to") LocalDate to);

    @Query("select sum(i.amount) from Income i where i.user.id = :userId")
    BigDecimal sumAll(@Param("userId") Long userId);

    @Query("select new com.splitledger.backend.dto.CategoryTotal(c.id, c.name, sum(i.amount)) "
            + "from Income i left join i.category c "
            + "where i.user.id = :userId and i.incomeDate >= :from and i.incomeDate <= :to "
            + "group by c.id, c.name "
            + "order by sum(i.amount) desc")
    List<CategoryTotal> categoryTotals(@Param("userId") Long userId,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);
}