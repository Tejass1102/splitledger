package com.splitledger.backend.dto;

import java.math.BigDecimal;

public record SplitShareResponse(Long memberId, String memberName, BigDecimal shareAmount) {}