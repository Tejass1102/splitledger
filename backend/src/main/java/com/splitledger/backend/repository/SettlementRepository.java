package com.splitledger.backend.repository;

import com.splitledger.backend.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    boolean existsByGroupId(Long groupId);

    boolean existsByFromMemberIdOrToMemberId(Long fromMemberId, Long toMemberId);
}