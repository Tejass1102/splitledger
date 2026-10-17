package com.splitledger.backend.repository;

import com.splitledger.backend.entity.SalaryCycle;
import com.splitledger.backend.enums.SalaryCycleStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SalaryCycleRepository extends JpaRepository<SalaryCycle, Long> {
    boolean existsByUserIdAndMonth(Long userId, LocalDate month);

    List<SalaryCycle> findByStatus(SalaryCycleStatus status);

    List<SalaryCycle> findByUserIdAndStatusOrderByCreditDateDesc(Long userId, SalaryCycleStatus status);

    // Row lock: two simultaneous "confirm" clicks cannot both create an income entry.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from SalaryCycle c where c.id = :id and c.user.id = :userId")
    Optional<SalaryCycle> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);
}