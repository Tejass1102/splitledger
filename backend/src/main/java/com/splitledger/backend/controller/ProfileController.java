package com.splitledger.backend.controller;

import com.splitledger.backend.dto.*;
import com.splitledger.backend.security.UserPrincipal;
import com.splitledger.backend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profileService;

    @GetMapping
    public ProfileResponse getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return profileService.getProfile(principal.getId());
    }

    @PutMapping
    public ProfileResponse updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateName(principal.getId(), request);
    }

    @PutMapping("/salary")
    public SalarySettingResponse saveSalary(@AuthenticationPrincipal UserPrincipal principal,
                                            @Valid @RequestBody SalarySettingRequest request) {
        return profileService.saveSalary(principal.getId(), request);
    }
}