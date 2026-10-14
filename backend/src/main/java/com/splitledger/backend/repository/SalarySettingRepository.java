package com.splitledger.backend.repository;

import com.splitledger.backend.entity.SalarySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SalarySettingRepository extends JpaRepository<SalarySetting, Long> {
    Optional<SalarySetting> findByUserId(Long userId);
}