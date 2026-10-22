package com.splitledger.backend.service;

import com.splitledger.backend.dto.SplitInput;
import com.splitledger.backend.enums.SplitType;
import com.splitledger.backend.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SplitCalculatorTest {

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private static SplitInput member(long id) {
        return new SplitInput(id, null);
    }

    private static SplitInput member(long id, String value) {
        return new SplitInput(id, bd(value));
    }

    private static BigDecimal sum(Map<Long, BigDecimal> shares) {
        return shares.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ---------- EQUAL ----------

    @Test
    void equalSplitGivesTheLeftoverPaiseToTheFirstMembers() {
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.EQUAL, bd("100.00"), List.of(member(1), member(2), member(3)));

        assertThat(shares.keySet()).containsExactly(1L, 2L, 3L);
        assertThat(shares.values()).containsExactly(bd("33.34"), bd("33.33"), bd("33.33"));
        assertThat(sum(shares)).isEqualByComparingTo("100.00");
    }

    @Test
    void equalSplitOfAnEvenAmountGivesEveryoneTheSameShare() {
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.EQUAL, bd("100.00"), List.of(member(1), member(2), member(3), member(4)));

        assertThat(shares.values()).containsExactly(
                bd("25.00"), bd("25.00"), bd("25.00"), bd("25.00"));
    }

    @Test
    void equalSplitOfOnePaiseGoesToTheFirstMember() {
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.EQUAL, bd("0.01"), List.of(member(1), member(2), member(3)));

        assertThat(shares.values()).containsExactly(bd("0.01"), bd("0.00"), bd("0.00"));
    }

    @Test
    void equalSplitWithOneMemberGivesThemEverything() {
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.EQUAL, bd("10.00"), List.of(member(1)));

        assertThat(shares.values()).containsExactly(bd("10.00"));
    }

    @Test
    void equalSplitRejectsValues() {
        assertThatThrownBy(() -> SplitCalculator.calculate(
                SplitType.EQUAL, bd("100.00"), List.of(member(1, "50.00"), member(2))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EQUAL");
    }

    @Test
    void equalSplitAlwaysAddsUpAndSharesDifferByAtMostOnePaisa() {
        for (int cents = 1; cents <= 3000; cents += 7) {
            for (int n = 1; n <= 12; n++) {
                BigDecimal total = BigDecimal.valueOf(cents, 2);
                List<SplitInput> inputs = new ArrayList<>();
                for (int i = 1; i <= n; i++) {
                    inputs.add(member(i));
                }

                Map<Long, BigDecimal> shares = SplitCalculator.calculate(SplitType.EQUAL, total, inputs);

                assertThat(sum(shares)).isEqualByComparingTo(total);
                BigDecimal gap = Collections.max(shares.values()).subtract(Collections.min(shares.values()));
                assertThat(gap).isLessThanOrEqualTo(bd("0.01"));
            }
        }
    }

    // ---------- EXACT ----------

    @Test
    void exactSplitKeepsTheGivenAmounts() {
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.EXACT, bd("90.00"),
                List.of(member(1, "40.00"), member(2, "30.00"), member(3, "20.00")));

        assertThat(shares.values()).containsExactly(bd("40.00"), bd("30.00"), bd("20.00"));
    }

    @Test
    void exactSplitAcceptsWholeNumbers() {
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.EXACT, bd("90.00"), List.of(member(1, "45"), member(2, "45")));

        assertThat(shares.values()).containsExactly(bd("45.00"), bd("45.00"));
    }

    @Test
    void exactSplitRejectsAmountsThatDoNotAddUp() {
        assertThatThrownBy(() -> SplitCalculator.calculate(
                SplitType.EXACT, bd("90.00"),
                List.of(member(1, "40.00"), member(2, "30.00"), member(3, "10.00"))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("80.00")
                .hasMessageContaining("90.00");
    }

    @Test
    void exactSplitRequiresAnAmountForEveryone() {
        assertThatThrownBy(() -> SplitCalculator.calculate(
                SplitType.EXACT, bd("90.00"), List.of(member(1, "90.00"), member(2))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("amount");
    }

    // ---------- PERCENTAGE ----------

    @Test
    void percentageSplitGivesTheLeftoverPaisaToTheLargestRoundingLoss() {
        // exact shares are 3.3330, 3.3330 and 3.3340; rounded down they add up to 9.99
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.PERCENTAGE, bd("10.00"),
                List.of(member(1, "33.33"), member(2, "33.33"), member(3, "33.34")));

        assertThat(shares.values()).containsExactly(bd("3.33"), bd("3.33"), bd("3.34"));
        assertThat(sum(shares)).isEqualByComparingTo("10.00");
    }

    @Test
    void percentageSplitOfRoundNumbers() {
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.PERCENTAGE, bd("100.00"),
                List.of(member(1, "50"), member(2, "30"), member(3, "20")));

        assertThat(shares.values()).containsExactly(bd("50.00"), bd("30.00"), bd("20.00"));
    }

    @Test
    void percentageTiesGoToTheEarlierMember() {
        Map<Long, BigDecimal> shares = SplitCalculator.calculate(
                SplitType.PERCENTAGE, bd("0.01"), List.of(member(1, "50"), member(2, "50")));

        assertThat(shares.values()).containsExactly(bd("0.01"), bd("0.00"));
    }

    @Test
    void percentageSplitRejectsPercentagesThatDoNotAddUpTo100() {
        assertThatThrownBy(() -> SplitCalculator.calculate(
                SplitType.PERCENTAGE, bd("10.00"),
                List.of(member(1, "50"), member(2, "30"), member(3, "19"))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("must add up to 100");
    }

    @Test
    void percentageSplitRequiresAPercentageForEveryone() {
        assertThatThrownBy(() -> SplitCalculator.calculate(
                SplitType.PERCENTAGE, bd("10.00"), List.of(member(1, "100"), member(2))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("percentage");
    }

    @Test
    void percentageSplitAlwaysAddsUpAndStaysWithinOnePaisaOfTheExactShare() {
        Random random = new Random(42);
        for (int run = 0; run < 2000; run++) {
            int n = 1 + random.nextInt(6);

            // n parts, in hundredths of a percent, that add up to exactly 100.00%
            int[] cuts = new int[n + 1];
            cuts[n] = 10_000;
            for (int i = 1; i < n; i++) {
                cuts[i] = random.nextInt(10_001);
            }
            Arrays.sort(cuts);

            List<SplitInput> inputs = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                inputs.add(new SplitInput(i + 1L, BigDecimal.valueOf(cuts[i + 1] - cuts[i], 2)));
            }
            BigDecimal total = BigDecimal.valueOf(1 + random.nextInt(10_000_000), 2);

            Map<Long, BigDecimal> shares = SplitCalculator.calculate(SplitType.PERCENTAGE, total, inputs);

            assertThat(sum(shares)).isEqualByComparingTo(total);
            for (SplitInput input : inputs) {
                BigDecimal exact = total.multiply(input.value()).movePointLeft(2);
                BigDecimal share = shares.get(input.memberId());
                assertThat(share.signum()).isGreaterThanOrEqualTo(0);
                assertThat(share.subtract(exact).abs()).isLessThan(bd("0.01"));
            }
        }
    }
}