package com.splitledger.backend.repository;

import com.splitledger.backend.dto.GroupMemberCount;
import com.splitledger.backend.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    List<GroupMember> findByGroupIdOrderByIdAsc(Long groupId);

    Optional<GroupMember> findByIdAndGroupId(Long id, Long groupId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndDisplayNameIgnoreCase(Long groupId, String displayName);

    void deleteByGroupId(Long groupId);

    @Query("select new com.splitledger.backend.dto.GroupMemberCount(m.group.id, count(m)) "
            + "from GroupMember m where m.group.id in :groupIds group by m.group.id")
    List<GroupMemberCount> countByGroupIds(@Param("groupIds") Collection<Long> groupIds);
}