package com.splitledger.backend.service;

import com.splitledger.backend.dto.GroupExpenseRequest;
import com.splitledger.backend.dto.GroupExpenseResponse;
import com.splitledger.backend.dto.SplitInput;
import com.splitledger.backend.dto.SplitShareResponse;
import com.splitledger.backend.entity.ExpenseGroup;
import com.splitledger.backend.entity.ExpenseSplit;
import com.splitledger.backend.entity.GroupExpense;
import com.splitledger.backend.entity.GroupMember;
import com.splitledger.backend.exception.BadRequestException;
import com.splitledger.backend.exception.ForbiddenException;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.ExpenseSplitRepository;
import com.splitledger.backend.repository.GroupExpenseRepository;
import com.splitledger.backend.repository.GroupMemberRepository;
import com.splitledger.backend.repository.GroupRepository;
import com.splitledger.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupExpenseService {
    private static final Sort NEWEST_FIRST =
            Sort.by(Sort.Direction.DESC, "expenseDate").and(Sort.by(Sort.Direction.DESC, "id"));

    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupExpenseRepository expenseRepository;
    private final ExpenseSplitRepository splitRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupExpenseResponse create(Long userId, Long groupId, GroupExpenseRequest request) {
        ExpenseGroup group = findGroup(userId, groupId);
        Map<Long, GroupMember> members = membersOf(groupId);
        GroupMember payer = requireMember(members, request.paidByMemberId(), "The payer");
        Map<Long, BigDecimal> shares = calculateShares(request, members);

        GroupExpense expense = new GroupExpense();
        expense.setGroup(group);
        expense.setCreatedBy(userRepository.getReferenceById(userId));
        apply(expense, request, payer);
        expenseRepository.save(expense);

        return toResponse(expense, saveSplits(expense, shares, members));
    }

    @Transactional(readOnly = true)
    public List<GroupExpenseResponse> list(Long userId, Long groupId, LocalDate from, LocalDate to,
                                           Long paidByMemberId) {
        findGroup(userId, groupId);
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("'from' must not be after 'to'");
        }
        List<GroupExpense> expenses =
                expenseRepository.findAll(filter(groupId, from, to, paidByMemberId), NEWEST_FIRST);
        if (expenses.isEmpty()) {
            return List.of();
        }

        Map<Long, List<ExpenseSplit>> splitsByExpense = new HashMap<>();
        splitRepository.findByExpenseIds(expenses.stream().map(GroupExpense::getId).toList())
                .forEach(s -> splitsByExpense
                        .computeIfAbsent(s.getGroupExpense().getId(), k -> new ArrayList<>())
                        .add(s));

        return expenses.stream()
                .map(e -> toResponse(e, splitsByExpense.getOrDefault(e.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupExpenseResponse get(Long userId, Long groupId, Long expenseId) {
        findGroup(userId, groupId);
        GroupExpense expense = findExpense(groupId, expenseId);
        return toResponse(expense, splitRepository.findByExpenseIds(List.of(expenseId)));
    }

    @Transactional
    public GroupExpenseResponse update(Long userId, Long groupId, Long expenseId,
                                       GroupExpenseRequest request) {
        ExpenseGroup group = findGroup(userId, groupId);
        GroupExpense expense = findExpense(groupId, expenseId);
        requireCanModify(userId, group, expense, "edit");

        // Validate everything before touching the old shares.
        Map<Long, GroupMember> members = membersOf(groupId);
        GroupMember payer = requireMember(members, request.paidByMemberId(), "The payer");
        Map<Long, BigDecimal> shares = calculateShares(request, members);

        apply(expense, request, payer);
        splitRepository.deleteByGroupExpenseId(expenseId);
        return toResponse(expense, saveSplits(expense, shares, members));
    }

    @Transactional
    public void delete(Long userId, Long groupId, Long expenseId) {
        ExpenseGroup group = findGroup(userId, groupId);
        GroupExpense expense = findExpense(groupId, expenseId);
        requireCanModify(userId, group, expense, "delete");

        splitRepository.deleteByGroupExpenseId(expenseId);
        expenseRepository.delete(expense);
    }

    // A group the user is a member of; anyone else gets 404.
    private ExpenseGroup findGroup(Long userId, Long groupId) {
        return groupRepository.findVisibleById(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
    }

    // Looked up inside the group, so an expense id from another group is a 404 too.
    private GroupExpense findExpense(Long groupId, Long expenseId) {
        return expenseRepository.findByIdAndGroupId(expenseId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
    }

    // Only the person who added the expense, or the group creator.
    private void requireCanModify(Long userId, ExpenseGroup group, GroupExpense expense, String action) {
        boolean isAdder = expense.getCreatedBy().getId().equals(userId);
        boolean isGroupCreator = group.getCreatedBy().getId().equals(userId);
        if (!isAdder && !isGroupCreator) {
            throw new ForbiddenException(
                    "Only the person who added this expense or the group creator can " + action + " it");
        }
    }

    private Map<Long, GroupMember> membersOf(Long groupId) {
        return memberRepository.findByGroupIdOrderByIdAsc(groupId).stream()
                .collect(Collectors.toMap(GroupMember::getId, m -> m));
    }

    private GroupMember requireMember(Map<Long, GroupMember> members, Long memberId, String who) {
        GroupMember member = members.get(memberId);
        if (member == null) {
            throw new BadRequestException(who + " must be a member of this group");
        }
        return member;
    }

    private Map<Long, BigDecimal> calculateShares(GroupExpenseRequest request,
                                                  Map<Long, GroupMember> members) {
        Set<Long> seen = new HashSet<>();
        for (SplitInput input : request.splits()) {
            if (!seen.add(input.memberId())) {
                throw new BadRequestException("A member appears more than once in the split");
            }
            requireMember(members, input.memberId(), "Every member in the split");
        }
        return SplitCalculator.calculate(request.splitType(), request.amount(), request.splits());
    }

    private void apply(GroupExpense expense, GroupExpenseRequest request, GroupMember payer) {
        expense.setPaidBy(payer);
        expense.setAmount(request.amount().setScale(2, RoundingMode.UNNECESSARY));
        expense.setDescription(request.description().trim());
        expense.setExpenseDate(request.expenseDate());
        expense.setSplitType(request.splitType());
    }

    private List<ExpenseSplit> saveSplits(GroupExpense expense, Map<Long, BigDecimal> shares,
                                          Map<Long, GroupMember> members) {
        List<ExpenseSplit> saved = new ArrayList<>();
        shares.forEach((memberId, share) -> {
            ExpenseSplit split = new ExpenseSplit();
            split.setGroupExpense(expense);
            split.setMember(members.get(memberId));
            split.setShareAmount(share);
            saved.add(splitRepository.save(split));
        });
        return saved;
    }

    // The group condition is always added; the others only when the filter was given.
    private Specification<GroupExpense> filter(Long groupId, LocalDate from, LocalDate to,
                                               Long paidByMemberId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("group").get("id"), groupId));
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("expenseDate"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<LocalDate>get("expenseDate"), to));
            }
            if (paidByMemberId != null) {
                predicates.add(cb.equal(root.get("paidBy").get("id"), paidByMemberId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private GroupExpenseResponse toResponse(GroupExpense e, List<ExpenseSplit> splits) {
        List<SplitShareResponse> shares = splits.stream()
                .map(s -> new SplitShareResponse(
                        s.getMember().getId(), s.getMember().getDisplayName(), s.getShareAmount()))
                .toList();
        return new GroupExpenseResponse(
                e.getId(), e.getGroup().getId(), e.getDescription(), e.getAmount(), e.getExpenseDate(),
                e.getSplitType(), e.getPaidBy().getId(), e.getPaidBy().getDisplayName(),
                e.getCreatedBy().getId(), shares);
    }
}