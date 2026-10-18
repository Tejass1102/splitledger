package com.splitledger.backend.repository;

import com.splitledger.backend.dto.MemberAmount;
import com.splitledger.backend.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    boolean existsByGroupId(Long groupId);

    boolean existsByFromMemberIdOrToMemberId(Long fromMemberId, Long toMemberId);

    Optional<Settlement> findByIdAndGroupId(Long id, Long groupId);

    @Query("select s from Settlement s join fetch s.fromMember join fetch s.toMember "
            + "where s.group.id = :groupId order by s.settledOn desc, s.id desc")
    List<Settlement> findAllInGroup(@Param("groupId") Long groupId);

    // Cash each member handed over
    @Query("select new com.splitledger.backend.dto.MemberAmount(s.fromMember.id, sum(s.amount)) "
            + "from Settlement s where s.group.id = :groupId group by s.fromMember.id")
    List<MemberAmount> sumPaidByMember(@Param("groupId") Long groupId);

    // Cash each member received
    @Query("select new com.splitledger.backend.dto.MemberAmount(s.toMember.id, sum(s.amount)) "
            + "from Settlement s where s.group.id = :groupId group by s.toMember.id")
    List<MemberAmount> sumReceivedByMember(@Param("groupId") Long groupId);
}