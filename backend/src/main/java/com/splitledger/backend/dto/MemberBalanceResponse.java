package com.splitledger.backend.dto;

import java.math.BigDecimal;

// net > 0: is owed money, net < 0: owes money
public record MemberBalanceResponse(
        Long memberId,
        String displayName,
        boolean guest,
        BigDecimal paid,                 // total of group expenses this member paid
        BigDecimal share,                // total of this member's shares
        BigDecimal settlementsPaid,      // cash this member handed over in settlements
        BigDecimal settlementsReceived,  // cash this member received in settlements
        BigDecimal net) {}