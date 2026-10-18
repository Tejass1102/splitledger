package com.splitledger.backend.service;

import com.splitledger.backend.dto.SplitInput;
import com.splitledger.backend.enums.SplitType;
import com.splitledger.backend.exception.BadRequestException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

/**
 * Turns a split request into the final rupee share of each member.
 * Pure logic: no Spring and no database, so it is easy to unit test (Step 14).
 * The shares always add up exactly to the total.
 */
public final class SplitCalculator {
    private static final BigDecimal HUNDRED = new BigDecimal("100.00");
    private static final BigDecimal CENT = new BigDecimal("0.01");

    private SplitCalculator() {}

    /** Returns memberId -> share, in the same order as the input. */
    public static Map<Long, BigDecimal> calculate(SplitType type, BigDecimal total, List<SplitInput> inputs) {
        BigDecimal exactTotal = total.setScale(2, RoundingMode.UNNECESSARY);
        return switch (type) {
            case EQUAL -> equal(exactTotal, inputs);
            case EXACT -> exact(exactTotal, inputs);
            case PERCENTAGE -> percentage(exactTotal, inputs);
        };
    }

    // Everyone gets the total / n rounded down; the leftover paise go to the first members.
    private static Map<Long, BigDecimal> equal(BigDecimal total, List<SplitInput> inputs) {
        for (SplitInput in : inputs) {
            if (in.value() != null) {
                throw new BadRequestException("An EQUAL split needs only member ids, without values");
            }
        }
        int n = inputs.size();
        BigDecimal count = BigDecimal.valueOf(n);
        BigDecimal base = total.divide(count, 2, RoundingMode.DOWN);
        int extraCents = total.subtract(base.multiply(count)).movePointRight(2).intValueExact();

        Map<Long, BigDecimal> shares = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            shares.put(inputs.get(i).memberId(), i < extraCents ? base.add(CENT) : base);
        }
        return shares;
    }

    // The given amounts are the shares; they must add up exactly to the total.
    private static Map<Long, BigDecimal> exact(BigDecimal total, List<SplitInput> inputs) {
        Map<Long, BigDecimal> shares = new LinkedHashMap<>();
        BigDecimal sum = BigDecimal.ZERO.setScale(2);
        for (SplitInput in : inputs) {
            if (in.value() == null) {
                throw new BadRequestException("Every member needs an amount in an EXACT split");
            }
            BigDecimal share = in.value().setScale(2, RoundingMode.UNNECESSARY);
            shares.put(in.memberId(), share);
            sum = sum.add(share);
        }
        if (sum.compareTo(total) != 0) {
            throw new BadRequestException(
                    "The amounts add up to " + sum + " but the expense total is " + total);
        }
        return shares;
    }

    // Shares are rounded down, then the leftover paise go to the members who lost the most
    // in rounding (ties: the earlier member in the list).
    private static Map<Long, BigDecimal> percentage(BigDecimal total, List<SplitInput> inputs) {
        int n = inputs.size();
        BigDecimal[] percents = new BigDecimal[n];
        BigDecimal percentSum = BigDecimal.ZERO.setScale(2);
        for (int i = 0; i < n; i++) {
            BigDecimal value = inputs.get(i).value();
            if (value == null) {
                throw new BadRequestException("Every member needs a percentage in a PERCENTAGE split");
            }
            percents[i] = value.setScale(2, RoundingMode.UNNECESSARY);
            percentSum = percentSum.add(percents[i]);
        }
        if (percentSum.compareTo(HUNDRED) != 0) {
            throw new BadRequestException(
                    "The percentages add up to " + percentSum + " but must add up to 100");
        }

        BigDecimal[] shares = new BigDecimal[n];
        BigDecimal[] lost = new BigDecimal[n];
        BigDecimal floorSum = BigDecimal.ZERO.setScale(2);
        for (int i = 0; i < n; i++) {
            BigDecimal exactShare = total.multiply(percents[i]).movePointLeft(2);   // exact, 6 decimals
            shares[i] = exactShare.setScale(2, RoundingMode.DOWN);
            lost[i] = exactShare.subtract(shares[i]);
            floorSum = floorSum.add(shares[i]);
        }

        int extraCents = total.subtract(floorSum).movePointRight(2).intValueExact();
        List<Integer> order = IntStream.range(0, n).boxed()
                .sorted((a, b) -> lost[b].compareTo(lost[a]))   // stable: ties keep list order
                .toList();
        for (int k = 0; k < extraCents; k++) {
            int i = order.get(k);
            shares[i] = shares[i].add(CENT);
        }

        Map<Long, BigDecimal> result = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            result.put(inputs.get(i).memberId(), shares[i]);
        }
        return result;
    }
}