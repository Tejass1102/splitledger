package com.splitledger.backend.service;

import com.splitledger.backend.dto.AuthResponse;
import com.splitledger.backend.dto.GoogleLoginRequest;
import com.splitledger.backend.dto.LoginRequest;
import com.splitledger.backend.dto.RegisterRequest;
import com.splitledger.backend.entity.User;
import com.splitledger.backend.enums.AuthProvider;
import com.splitledger.backend.exception.ConflictException;
import com.splitledger.backend.exception.EmailAlreadyExistsException;
import com.splitledger.backend.repository.UserRepository;
import com.splitledger.backend.security.GoogleIdentity;
import com.splitledger.backend.security.GoogleTokenVerifier;
import com.splitledger.backend.security.JwtService;
import com.splitledger.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;

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

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdentity identity = googleTokenVerifier.verify(request.idToken());
        User user = userRepository.findByGoogleId(identity.googleId())
                .orElseGet(() -> linkOrCreate(identity));
        return buildResponse(new UserPrincipal(user));
    }

    // First time this Google account is seen: link it to the account with the same
    // (Google-verified) email, or create a new account.
    private User linkOrCreate(GoogleIdentity identity) {
        Optional<User> sameEmail = userRepository.findByEmail(identity.email());
        if (sameEmail.isPresent()) {
            User user = sameEmail.get();
            if (user.getGoogleId() != null) {
                throw new ConflictException("This email is already linked to a different Google account");
            }
            user.setGoogleId(identity.googleId());
            // Registration doesn't verify emails, so a password set by someone else must not
            // survive: only the Google-verified owner may use this account from now on.
            user.setPasswordHash(null);
            return user;
        }

        User user = new User();
        user.setName(identity.name());
        user.setEmail(identity.email());
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setGoogleId(identity.googleId());
        return userRepository.save(user);
    }

    private AuthResponse buildResponse(UserPrincipal p) {
        return new AuthResponse(jwtService.generateToken(p), "Bearer",
                p.getId(), p.getName(), p.getUsername());
    }
}