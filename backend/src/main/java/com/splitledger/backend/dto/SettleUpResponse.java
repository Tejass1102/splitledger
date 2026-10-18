package com.splitledger.backend.dto;

import java.util.List;

public record SettleUpResponse(Long groupId, List<PaymentSuggestion> payments) {}