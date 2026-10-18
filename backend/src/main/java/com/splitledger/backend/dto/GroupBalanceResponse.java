package com.splitledger.backend.dto;

import java.util.List;

public record GroupBalanceResponse(
        Long groupId,
        boolean settledUp,     // true when every net is zero
        List<MemberBalanceResponse> members) {}