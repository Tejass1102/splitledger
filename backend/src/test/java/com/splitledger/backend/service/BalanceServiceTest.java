package com.splitledger.backend.service;

import com.splitledger.backend.dto.GroupBalanceResponse;
import com.splitledger.backend.dto.MemberAmount;
import com.splitledger.backend.dto.MemberBalanceResponse;
import com.splitledger.backend.dto.PaymentSuggestion;
import com.splitledger.backend.dto.SettleUpResponse;
import com.splitledger.backend.entity.ExpenseGroup;
import com.splitledger.backend.entity.GroupMember;
import com.splitledger.backend.entity.User;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.ExpenseSplitRepository;
import com.splitledger.backend.repository.GroupExpenseRepository;
import com.splitledger.backend.repository.GroupMemberRepository;
import com.splitledger.backend.repository.GroupRepository;
import com.splitledger.backend.repository.SettlementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {
    private static final Long USER_ID = 1L;
    private static final Long GROUP_ID = 10L;

    @Mock GroupRepository groupRepository;
    @Mock GroupMemberRepository memberRepository;
    @Mock GroupExpenseRepository groupExpenseRepository;
    @Mock ExpenseSplitRepository splitRepository;
    @Mock SettlementRepository settlementRepository;

    private BalanceService service;

    @BeforeEach
    void setUp() {
        service = new BalanceService(groupRepository, memberRepository, groupExpenseRepository,
                splitRepository, settlementRepository);
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private static GroupMember member(long id, String name, boolean hasAccount) {
        GroupMember member = new GroupMember();
        member.setId(id);
        member.setDisplayName(name);
        if (hasAccount) {
            User user = new User();
            user.setId(id);
            member.setUser(user);
        }
        return member;
    }

    // Member 1 = Asha, 2 = Rahul (guest), 3 = Bala
    private void givenTheGroup() {
        when(groupRepository.findVisibleById(GROUP_ID, USER_ID)).thenReturn(Optional.of(new ExpenseGroup()));
        when(memberRepository.findByGroupIdOrderByIdAsc(GROUP_ID)).thenReturn(List.of(
                member(1, "Asha", true), member(2, "Rahul", false), member(3, "Bala", true)));
    }

    // The three expenses from the Step 11 Postman tests
    private void givenTheStepElevenExpenses() {
        when(groupExpenseRepository.sumPaidByMember(GROUP_ID)).thenReturn(List.of(
                new MemberAmount(1L, bd("300.00")),
                new MemberAmount(2L, bd("90.00")),
                new MemberAmount(3L, bd("60.00"))));
        when(splitRepository.sumSharesByMember(GROUP_ID)).thenReturn(List.of(
                new MemberAmount(1L, bd("140.00")),
                new MemberAmount(2L, bd("180.00")),
                new MemberAmount(3L, bd("130.00"))));
    }

    private void givenSettlements(List<MemberAmount> paid, List<MemberAmount> received) {
        when(settlementRepository.sumPaidByMember(GROUP_ID)).thenReturn(paid);
        when(settlementRepository.sumReceivedByMember(GROUP_ID)).thenReturn(received);
    }

    private static MemberBalanceResponse balanceOf(GroupBalanceResponse response, long memberId) {
        return response.members().stream()
                .filter(m -> m.memberId() == memberId)
                .findFirst()
                .orElseThrow();
    }

    @Test
    void balancesArePaidMinusSharesAndAddUpToZero() {
        givenTheGroup();
        givenTheStepElevenExpenses();
        givenSettlements(List.of(), List.of());

        GroupBalanceResponse result = service.balances(USER_ID, GROUP_ID);

        assertThat(result.settledUp()).isFalse();
        assertThat(balanceOf(result, 1).net()).isEqualByComparingTo("160.00");
        assertThat(balanceOf(result, 2).net()).isEqualByComparingTo("-90.00");
        assertThat(balanceOf(result, 3).net()).isEqualByComparingTo("-70.00");
        assertThat(result.members()).extracting(MemberBalanceResponse::guest)
                .containsExactly(false, true, false);

        BigDecimal total = result.members().stream()
                .map(MemberBalanceResponse::net)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(total).isEqualByComparingTo("0");
    }

    @Test
    void settlementsMoveTheBalances() {
        givenTheGroup();
        givenTheStepElevenExpenses();
        // Bala paid Asha 70.00, Rahul paid Asha 40.00
        givenSettlements(
                List.of(new MemberAmount(3L, bd("70.00")), new MemberAmount(2L, bd("40.00"))),
                List.of(new MemberAmount(1L, bd("110.00"))));

        GroupBalanceResponse result = service.balances(USER_ID, GROUP_ID);

        assertThat(result.settledUp()).isFalse();
        assertThat(balanceOf(result, 1).net()).isEqualByComparingTo("50.00");
        assertThat(balanceOf(result, 2).net()).isEqualByComparingTo("-50.00");
        assertThat(balanceOf(result, 3).net()).isEqualByComparingTo("0.00");
        assertThat(balanceOf(result, 3).settlementsPaid()).isEqualByComparingTo("70.00");
        assertThat(balanceOf(result, 1).settlementsReceived()).isEqualByComparingTo("110.00");
    }

    @Test
    void settleUpSuggestsWhatIsStillOwed() {
        givenTheGroup();
        givenTheStepElevenExpenses();
        givenSettlements(
                List.of(new MemberAmount(3L, bd("70.00")), new MemberAmount(2L, bd("40.00"))),
                List.of(new MemberAmount(1L, bd("110.00"))));

        SettleUpResponse result = service.settleUp(USER_ID, GROUP_ID);

        assertThat(result.payments()).hasSize(1);
        PaymentSuggestion payment = result.payments().get(0);
        assertThat(payment.fromMemberId()).isEqualTo(2L);
        assertThat(payment.fromName()).isEqualTo("Rahul");
        assertThat(payment.toMemberId()).isEqualTo(1L);
        assertThat(payment.toName()).isEqualTo("Asha");
        assertThat(payment.amount()).isEqualByComparingTo("50.00");
    }

    @Test
    void aFullySettledGroupHasNoBalancesAndNoPayments() {
        givenTheGroup();
        givenTheStepElevenExpenses();
        givenSettlements(
                List.of(new MemberAmount(3L, bd("70.00")), new MemberAmount(2L, bd("90.00"))),
                List.of(new MemberAmount(1L, bd("160.00"))));

        GroupBalanceResponse balances = service.balances(USER_ID, GROUP_ID);
        SettleUpResponse settleUp = service.settleUp(USER_ID, GROUP_ID);

        assertThat(balances.settledUp()).isTrue();
        assertThat(balances.members()).allSatisfy(m -> assertThat(m.net().signum()).isZero());
        assertThat(settleUp.payments()).isEmpty();
    }

    @Test
    void aMemberWithNoActivityHasZeroEverywhere() {
        when(groupRepository.findVisibleById(GROUP_ID, USER_ID)).thenReturn(Optional.of(new ExpenseGroup()));
        when(memberRepository.findByGroupIdOrderByIdAsc(GROUP_ID))
                .thenReturn(List.of(member(1, "Asha", true)));
        when(groupExpenseRepository.sumPaidByMember(GROUP_ID)).thenReturn(List.of());
        when(splitRepository.sumSharesByMember(GROUP_ID)).thenReturn(List.of());
        givenSettlements(List.of(), List.of());

        GroupBalanceResponse result = service.balances(USER_ID, GROUP_ID);

        MemberBalanceResponse only = balanceOf(result, 1);
        assertThat(only.paid()).isEqualByComparingTo("0");
        assertThat(only.share()).isEqualByComparingTo("0");
        assertThat(only.net()).isEqualByComparingTo("0");
        assertThat(result.settledUp()).isTrue();
    }

    @Test
    void aNonMemberGetsNotFoundAndNothingIsCalculated() {
        when(groupRepository.findVisibleById(GROUP_ID, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.balances(99L, GROUP_ID))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.settleUp(99L, GROUP_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(memberRepository, groupExpenseRepository, splitRepository, settlementRepository);
    }
}