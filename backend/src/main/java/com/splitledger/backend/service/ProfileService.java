package com.splitledger.backend.service;

import com.splitledger.backend.dto.*;
import com.splitledger.backend.entity.SalarySetting;
import com.splitledger.backend.entity.User;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.SalarySettingRepository;
import com.splitledger.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserRepository userRepository;
    private final SalarySettingRepository salarySettingRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        User user = findUser(userId);
        SalarySettingResponse salary = salarySettingRepository.findByUserId(userId)
                .map(this::toResponse)
                .orElse(null);
        return new ProfileResponse(user.getId(), user.getName(), user.getEmail(), salary);
    }

    @Transactional
    public ProfileResponse updateName(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        user.setName(request.name().trim());   // saved automatically at commit
        SalarySettingResponse salary = salarySettingRepository.findByUserId(userId)
                .map(this::toResponse)
                .orElse(null);
        return new ProfileResponse(user.getId(), user.getName(), user.getEmail(), salary);
    }

    @Transactional
    public SalarySettingResponse saveSalary(Long userId, SalarySettingRequest request) {
        SalarySetting setting = salarySettingRepository.findByUserId(userId)
                .orElseGet(() -> {
                    SalarySetting created = new SalarySetting();
                    created.setUser(userRepository.getReferenceById(userId));
                    return created;
                });

        setting.setAmount(request.amount());
        setting.setCreditDay(request.creditDay());
        setting.setActive(request.active() == null ? Boolean.TRUE : request.active());

        return toResponse(salarySettingRepository.save(setting));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private SalarySettingResponse toResponse(SalarySetting s) {
        return new SalarySettingResponse(s.getAmount(), s.getCreditDay(), s.getActive());
    }
}