package com.splitledger.backend.dto;

import java.math.BigDecimal;

public record MemberAmount(Long memberId, BigDecimal amount) {}