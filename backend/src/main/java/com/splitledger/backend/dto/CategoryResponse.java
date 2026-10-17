package com.splitledger.backend.dto;

import com.splitledger.backend.enums.CategoryType;

public record CategoryResponse(Long id, String name, CategoryType type, boolean builtIn) {}