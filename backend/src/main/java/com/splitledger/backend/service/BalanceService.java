package com.splitledger.backend.service;

import com.splitledger.backend.dto.GroupBalanceResponse;
import com.splitledger.backend.dto.MemberAmount;
import com.splitledger.backend.dto.MemberBalanceResponse;
import com.splitledger.backend.dto.PaymentSuggestion;
import com.splitledger.backend.dto.SettleUpResponse;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.ExpenseSplitRepository;
import com.splitledger.backend.repository.GroupExpenseRepository;
import com.splitledger.backend.repository.GroupMemberRepository;
import com.splitledger.backend.repository.GroupRepository;
import com.splitledger.backend.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BalanceService {
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupExpenseRepository groupExpenseRepository;
    private final ExpenseSplitRepository splitRepository;
    private final SettlementRepository settlementRepository;

    @Transactional(readOnly = true)
    public GroupBalanceResponse balances(Long userId, Long groupId) {
        requireMember(userId, groupId);
        List<MemberBalanceResponse> members = memberBalances(groupId);
        boolean settledUp = members.stream().allMatch(m -> m.net().signum() == 0);
        return new GroupBalanceResponse(groupId, settledUp, members);
    }

    @Transactional(readOnly = true)
    public SettleUpResponse settleUp(Long userId, Long groupId) {
        requireMember(userId, groupId);
        List<MemberBalanceResponse> members = memberBalances(groupId);

        Map<Long, BigDecimal> net = new LinkedHashMap<>();
        Map<Long, String> names = new HashMap<>();
        for (MemberBalanceResponse m : members) {
            net.put(m.memberId(), m.net());
            names.put(m.memberId(), m.displayName());
        }

        List<PaymentSuggestion> payments = DebtSimplifier.simplify(net).stream()
                .map(t -> new PaymentSuggestion(
                        t.fromMemberId(), names.get(t.fromMemberId()),
                        t.toMemberId(), names.get(t.toMemberId()),
                        t.amount()))
                .toList();
        return new SettleUpResponse(groupId, payments);
    }

    // A group the user is a member of; anyone else gets 404.
    private void requireMember(Long userId, Long groupId) {
        groupRepository.findVisibleById(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
    }

    // net = paid - shares + settlements paid - settlements received
    private List<MemberBalanceResponse> memberBalances(Long groupId) {
        Map<Long, BigDecimal> paid = toMap(groupExpenseRepository.sumPaidByMember(groupId));
        Map<Long, BigDecimal> shares = toMap(splitRepository.sumSharesByMember(groupId));
        Map<Long, BigDecimal> settlementsPaid = toMap(settlementRepository.sumPaidByMember(groupId));
        Map<Long, BigDecimal> settlementsReceived = toMap(settlementRepository.sumReceivedByMember(groupId));

        return memberRepository.findByGroupIdOrderByIdAsc(groupId).stream()
                .map(m -> {
                    BigDecimal p = paid.getOrDefault(m.getId(), ZERO);
                    BigDecimal sh = shares.getOrDefault(m.getId(), ZERO);
                    BigDecimal sp = settlementsPaid.getOrDefault(m.getId(), ZERO);
                    BigDecimal sr = settlementsReceived.getOrDefault(m.getId(), ZERO);
                    BigDecimal net = p.subtract(sh).add(sp).subtract(sr);
                    return new MemberBalanceResponse(
                            m.getId(), m.getDisplayName(), m.getUser() == null, p, sh, sp, sr, net);
                })
                .toList();
    }

    private Map<Long, BigDecimal> toMap(List<MemberAmount> rows) {
        Map<Long, BigDecimal> map = new HashMap<>();
        rows.forEach(r -> map.put(r.memberId(), r.amount()));
        return map;
    }
}