package com.splitledger.backend.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

/**
 * Turns each member's net balance into a short list of payments that settles everyone.
 * Pure logic: no Spring and no database, so it is easy to unit test (Step 14).
 * Greedy: the member owed the most is paid by the member who owes the most, repeatedly.
 * Ties go to the lower member id, so the result is always the same for the same input.
 */
public final class DebtSimplifier {

    public record Transfer(Long fromMemberId, Long toMemberId, BigDecimal amount) {}

    private static final class Entry {
        final Long memberId;
        BigDecimal amount;   // always positive: what is still owed to / by this member

        Entry(Long memberId, BigDecimal amount) {
            this.memberId = memberId;
            this.amount = amount;
        }
    }

    private static final Comparator<Entry> LARGEST_FIRST =
            Comparator.comparing((Entry e) -> e.amount, Comparator.reverseOrder())
                    .thenComparing(e -> e.memberId);

    private DebtSimplifier() {}

    /** netByMember: memberId -> net (positive = is owed, negative = owes). */
    public static List<Transfer> simplify(Map<Long, BigDecimal> netByMember) {
        PriorityQueue<Entry> creditors = new PriorityQueue<>(LARGEST_FIRST);
        PriorityQueue<Entry> debtors = new PriorityQueue<>(LARGEST_FIRST);

        netByMember.forEach((memberId, net) -> {
            if (net.signum() > 0) {
                creditors.add(new Entry(memberId, net));
            } else if (net.signum() < 0) {
                debtors.add(new Entry(memberId, net.negate()));
            }
        });

        List<Transfer> transfers = new ArrayList<>();
        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            Entry creditor = creditors.poll();
            Entry debtor = debtors.poll();

            BigDecimal pay = creditor.amount.min(debtor.amount);
            transfers.add(new Transfer(debtor.memberId, creditor.memberId, pay));

            // Changed only after polling, then put back if anything is still owed.
            creditor.amount = creditor.amount.subtract(pay);
            debtor.amount = debtor.amount.subtract(pay);
            if (creditor.amount.signum() > 0) {
                creditors.add(creditor);
            }
            if (debtor.amount.signum() > 0) {
                debtors.add(debtor);
            }
        }
        return transfers;
    }
}