package com.splitledger.backend.service;

import com.splitledger.backend.dto.AuthResponse;
import com.splitledger.backend.dto.LoginRequest;
import com.splitledger.backend.dto.RegisterRequest;
import com.splitledger.backend.entity.User;
import com.splitledger.backend.exception.EmailAlreadyExistsException;
import com.splitledger.backend.repository.UserRepository;
import com.splitledger.backend.security.JwtService;
import com.splitledger.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);
        return buildResponse(new UserPrincipal(user));
    }

    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email().trim().toLowerCase(), request.password()));
        return buildResponse((UserPrincipal) auth.getPrincipal());
    }

    private AuthResponse buildResponse(UserPrincipal p) {
        return new AuthResponse(jwtService.generateToken(p), "Bearer",
                p.getId(), p.getName(), p.getUsername());
    }
}