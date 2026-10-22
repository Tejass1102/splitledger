package com.splitledger.backend.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import static org.assertj.core.api.Assertions.assertThat;

class DebtSimplifierTest {

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    @Test
    void settlesTheStepElevenExample() {
        Map<Long, BigDecimal> net = Map.of(1L, bd("160.00"), 2L, bd("-90.00"), 3L, bd("-70.00"));

        List<DebtSimplifier.Transfer> transfers = DebtSimplifier.simplify(net);

        assertThat(transfers).containsExactly(
                new DebtSimplifier.Transfer(2L, 1L, bd("90.00")),
                new DebtSimplifier.Transfer(3L, 1L, bd("70.00")));
    }

    @Test
    void nobodyOwesAnythingWhenEveryBalanceIsZero() {
        assertThat(DebtSimplifier.simplify(Map.of())).isEmpty();
        assertThat(DebtSimplifier.simplify(Map.of(1L, bd("0.00"), 2L, bd("0.00")))).isEmpty();
    }

    @Test
    void twoPeopleNeedOnePayment() {
        List<DebtSimplifier.Transfer> transfers =
                DebtSimplifier.simplify(Map.of(1L, bd("50.00"), 2L, bd("-50.00")));

        assertThat(transfers).containsExactly(new DebtSimplifier.Transfer(2L, 1L, bd("50.00")));
    }

    @Test
    void tiesGoToTheLowerMemberId() {
        Map<Long, BigDecimal> net = Map.of(1L, bd("50.00"), 2L, bd("50.00"), 3L, bd("-100.00"));

        List<DebtSimplifier.Transfer> transfers = DebtSimplifier.simplify(net);

        assertThat(transfers).containsExactly(
                new DebtSimplifier.Transfer(3L, 1L, bd("50.00")),
                new DebtSimplifier.Transfer(3L, 2L, bd("50.00")));
    }

    @Test
    void fourPeopleNeedAtMostThreePayments() {
        Map<Long, BigDecimal> net = Map.of(
                1L, bd("30.00"), 2L, bd("70.00"), 3L, bd("-40.00"), 4L, bd("-60.00"));

        List<DebtSimplifier.Transfer> transfers = DebtSimplifier.simplify(net);

        assertThat(transfers).containsExactly(
                new DebtSimplifier.Transfer(4L, 2L, bd("60.00")),
                new DebtSimplifier.Transfer(3L, 1L, bd("30.00")),
                new DebtSimplifier.Transfer(3L, 2L, bd("10.00")));
    }

    @Test
    void randomBalancesAlwaysEndUpFullySettled() {
        Random random = new Random(7);
        for (int run = 0; run < 2000; run++) {
            int n = 2 + random.nextInt(7);

            // random balances in paise that add up to exactly zero
            Map<Long, BigDecimal> net = new LinkedHashMap<>();
            long total = 0;
            for (int i = 1; i < n; i++) {
                long cents = random.nextInt(100_001) - 50_000;
                net.put((long) i, BigDecimal.valueOf(cents, 2));
                total += cents;
            }
            net.put((long) n, BigDecimal.valueOf(-total, 2));

            List<DebtSimplifier.Transfer> transfers = DebtSimplifier.simplify(net);

            // apply the payments: the payer's balance goes up, the receiver's goes down
            Map<Long, BigDecimal> remaining = new HashMap<>(net);
            for (DebtSimplifier.Transfer t : transfers) {
                assertThat(t.amount().signum()).isPositive();
                assertThat(t.fromMemberId()).isNotEqualTo(t.toMemberId());
                remaining.merge(t.fromMemberId(), t.amount(), BigDecimal::add);
                remaining.merge(t.toMemberId(), t.amount().negate(), BigDecimal::add);
            }
            remaining.values().forEach(value -> assertThat(value.signum()).isZero());

            long withBalance = net.values().stream().filter(value -> value.signum() != 0).count();
            assertThat(transfers.size()).isLessThanOrEqualTo((int) Math.max(0, withBalance - 1));
        }
    }
}