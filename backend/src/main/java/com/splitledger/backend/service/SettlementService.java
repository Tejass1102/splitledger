package com.splitledger.backend.service;

import com.splitledger.backend.dto.SettlementRequest;
import com.splitledger.backend.dto.SettlementResponse;
import com.splitledger.backend.entity.ExpenseGroup;
import com.splitledger.backend.entity.GroupMember;
import com.splitledger.backend.entity.Settlement;
import com.splitledger.backend.exception.BadRequestException;
import com.splitledger.backend.exception.ForbiddenException;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.GroupMemberRepository;
import com.splitledger.backend.repository.GroupRepository;
import com.splitledger.backend.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final SettlementRepository settlementRepository;
    private final Clock clock;

    @Transactional
    public SettlementResponse create(Long userId, Long groupId, SettlementRequest request) {
        ExpenseGroup group = findGroup(userId, groupId);

        if (request.fromMemberId().equals(request.toMemberId())) {
            throw new BadRequestException("The payer and the receiver must be different members");
        }
        GroupMember from = findMember(groupId, request.fromMemberId(), "The payer");
        GroupMember to = findMember(groupId, request.toMemberId(), "The receiver");

        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setFromMember(from);
        settlement.setToMember(to);
        settlement.setAmount(request.amount().setScale(2, RoundingMode.UNNECESSARY));
        settlement.setSettledOn(request.settledOn() != null ? request.settledOn() : LocalDate.now(clock));
        settlementRepository.save(settlement);
        return toResponse(settlement);
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> list(Long userId, Long groupId) {
        findGroup(userId, groupId);
        return settlementRepository.findAllInGroup(groupId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Long userId, Long groupId, Long settlementId) {
        ExpenseGroup group = findGroup(userId, groupId);
        Settlement settlement = settlementRepository.findByIdAndGroupId(settlementId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found"));

        boolean isGroupCreator = group.getCreatedBy().getId().equals(userId);
        boolean isInvolved = isLinkedTo(settlement.getFromMember(), userId)
                || isLinkedTo(settlement.getToMember(), userId);
        if (!isGroupCreator && !isInvolved) {
            throw new ForbiddenException(
                    "Only the group creator or a person involved in this settlement can delete it");
        }
        settlementRepository.delete(settlement);
    }

    // A group the user is a member of; anyone else gets 404.
    private ExpenseGroup findGroup(Long userId, Long groupId) {
        return groupRepository.findVisibleById(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
    }

    // Looked up inside the group, so a member id from another group is rejected.
    private GroupMember findMember(Long groupId, Long memberId, String who) {
        return memberRepository.findByIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new BadRequestException(who + " must be a member of this group"));
    }

    private boolean isLinkedTo(GroupMember member, Long userId) {
        return member.getUser() != null && member.getUser().getId().equals(userId);
    }

    private SettlementResponse toResponse(Settlement s) {
        return new SettlementResponse(
                s.getId(), s.getGroup().getId(),
                s.getFromMember().getId(), s.getFromMember().getDisplayName(),
                s.getToMember().getId(), s.getToMember().getDisplayName(),
                s.getAmount(), s.getSettledOn());
    }
}