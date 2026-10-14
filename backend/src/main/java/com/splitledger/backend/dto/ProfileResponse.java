package com.splitledger.backend.dto;

public record ProfileResponse(Long id, String name, String email, SalarySettingResponse salary) {}