package com.splitledger.backend.service;

import com.splitledger.backend.dto.GroupExpenseRequest;
import com.splitledger.backend.dto.GroupExpenseResponse;
import com.splitledger.backend.dto.SplitInput;
import com.splitledger.backend.dto.SplitShareResponse;
import com.splitledger.backend.entity.ExpenseGroup;
import com.splitledger.backend.entity.ExpenseSplit;
import com.splitledger.backend.entity.GroupExpense;
import com.splitledger.backend.entity.GroupMember;
import com.splitledger.backend.entity.User;
import com.splitledger.backend.enums.SplitType;
import com.splitledger.backend.exception.BadRequestException;
import com.splitledger.backend.exception.ForbiddenException;
import com.splitledger.backend.repository.ExpenseSplitRepository;
import com.splitledger.backend.repository.GroupExpenseRepository;
import com.splitledger.backend.repository.GroupMemberRepository;
import com.splitledger.backend.repository.GroupRepository;
import com.splitledger.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupExpenseServiceTest {
    private static final Long CREATOR_ID = 1L;
    private static final Long GROUP_ID = 10L;

    @Mock GroupRepository groupRepository;
    @Mock GroupMemberRepository memberRepository;
    @Mock GroupExpenseRepository expenseRepository;
    @Mock ExpenseSplitRepository splitRepository;
    @Mock UserRepository userRepository;

    private GroupExpenseService service;
    private User creator;
    private ExpenseGroup group;

    @BeforeEach
    void setUp() {
        service = new GroupExpenseService(groupRepository, memberRepository, expenseRepository,
                splitRepository, userRepository);

        creator = new User();
        creator.setId(CREATOR_ID);
        group = new ExpenseGroup();
        group.setId(GROUP_ID);
        group.setCreatedBy(creator);
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private static GroupMember member(long id, String name) {
        GroupMember member = new GroupMember();
        member.setId(id);
        member.setDisplayName(name);
        return member;
    }

    // Members 1, 2 and 3 belong to the group; the creator (user 1) can see it.
    private void givenGroupWithThreeMembers() {
        when(groupRepository.findVisibleById(GROUP_ID, CREATOR_ID)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdOrderByIdAsc(GROUP_ID)).thenReturn(List.of(
                member(1, "Asha"), member(2, "Rahul"), member(3, "Bala")));
    }

    private static GroupExpenseRequest equalRequest(Long payerId, Long... memberIds) {
        List<SplitInput> splits = Arrays.stream(memberIds)
                .map(id -> new SplitInput(id, null))
                .toList();
        return new GroupExpenseRequest(bd("100.00"), LocalDate.of(2026, 10, 12), "Dinner",
                payerId, SplitType.EQUAL, splits);
    }

    @Test
    void createSavesEqualSharesThatAddUpToTheTotal() {
        givenGroupWithThreeMembers();
        when(userRepository.getReferenceById(CREATOR_ID)).thenReturn(creator);
        when(splitRepository.save(any(ExpenseSplit.class))).thenAnswer(call -> call.getArgument(0));

        GroupExpenseResponse response = service.create(CREATOR_ID, GROUP_ID, equalRequest(1L, 1L, 2L, 3L));

        assertThat(response.paidByName()).isEqualTo("Asha");
        assertThat(response.splits()).extracting(SplitShareResponse::shareAmount)
                .containsExactly(bd("33.34"), bd("33.33"), bd("33.33"));
        verify(splitRepository, times(3)).save(any(ExpenseSplit.class));
    }

    @Test
    void createRejectsAPayerWhoIsNotInTheGroup() {
        givenGroupWithThreeMembers();

        assertThatThrownBy(() -> service.create(CREATOR_ID, GROUP_ID, equalRequest(99L, 1L, 2L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("payer");

        verify(expenseRepository, never()).save(any(GroupExpense.class));
        verifyNoInteractions(splitRepository);
    }

    @Test
    void createRejectsASplitMemberWhoIsNotInTheGroup() {
        givenGroupWithThreeMembers();

        assertThatThrownBy(() -> service.create(CREATOR_ID, GROUP_ID, equalRequest(1L, 1L, 99L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("split");

        verify(expenseRepository, never()).save(any(GroupExpense.class));
        verifyNoInteractions(splitRepository);
    }

    @Test
    void createRejectsTheSameMemberTwiceInTheSplit() {
        givenGroupWithThreeMembers();

        assertThatThrownBy(() -> service.create(CREATOR_ID, GROUP_ID, equalRequest(1L, 1L, 1L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("more than once");

        verify(expenseRepository, never()).save(any(GroupExpense.class));
        verifyNoInteractions(splitRepository);
    }

    @Test
    void updateIsForbiddenForSomeoneWhoNeitherAddedTheExpenseNorCreatedTheGroup() {
        Long regularMember = 5L;
        User adder = new User();
        adder.setId(2L);
        GroupExpense expense = new GroupExpense();
        expense.setCreatedBy(adder);
        when(groupRepository.findVisibleById(GROUP_ID, regularMember)).thenReturn(Optional.of(group));
        when(expenseRepository.findByIdAndGroupId(77L, GROUP_ID)).thenReturn(Optional.of(expense));

        assertThatThrownBy(() -> service.update(regularMember, GROUP_ID, 77L, equalRequest(1L, 1L, 2L)))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(splitRepository);
    }

    @Test
    void theGroupCreatorCanEditAnExpenseAddedBySomeoneElse() {
        givenGroupWithThreeMembers();
        User adder = new User();
        adder.setId(2L);
        GroupExpense expense = new GroupExpense();
        expense.setGroup(group);
        expense.setCreatedBy(adder);
        when(expenseRepository.findByIdAndGroupId(77L, GROUP_ID)).thenReturn(Optional.of(expense));
        when(splitRepository.save(any(ExpenseSplit.class))).thenAnswer(call -> call.getArgument(0));

        GroupExpenseRequest request = new GroupExpenseRequest(
                bd("90.00"), LocalDate.of(2026, 10, 12), "Groceries", 1L, SplitType.EXACT,
                List.of(new SplitInput(1L, bd("40.00")), new SplitInput(2L, bd("50.00"))));

        GroupExpenseResponse response = service.update(CREATOR_ID, GROUP_ID, 77L, request);

        assertThat(response.splitType()).isEqualTo(SplitType.EXACT);
        assertThat(response.splits()).extracting(SplitShareResponse::shareAmount)
                .containsExactly(bd("40.00"), bd("50.00"));
        verify(splitRepository).deleteByGroupExpenseId(77L);
    }
}