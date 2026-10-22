package com.splitledger.backend.service;

import com.splitledger.backend.dto.GoogleLoginRequest;
import com.splitledger.backend.entity.User;
import com.splitledger.backend.enums.AuthProvider;
import com.splitledger.backend.exception.ConflictException;
import com.splitledger.backend.exception.InvalidGoogleTokenException;
import com.splitledger.backend.repository.UserRepository;
import com.splitledger.backend.security.GoogleIdentity;
import com.splitledger.backend.security.GoogleTokenVerifier;
import com.splitledger.backend.security.JwtService;
import com.splitledger.backend.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceGoogleTest {
    private static final String ID_TOKEN = "google-id-token";
    private final GoogleLoginRequest request = new GoogleLoginRequest(ID_TOKEN);

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtService jwtService;
    @Mock GoogleTokenVerifier googleTokenVerifier;

    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(userRepository, passwordEncoder, authenticationManager,
                jwtService, googleTokenVerifier);
    }

    private void givenGoogleSays(String googleId, String email, String name) {
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(new GoogleIdentity(googleId, email, name));
    }

    private void givenOurTokenCanBeIssued() {
        when(jwtService.generateToken(any(UserPrincipal.class))).thenReturn("our-jwt");
    }

    private static User account(long id, String email, String googleId, String passwordHash) {
        User user = new User();
        user.setId(id);
        user.setName("Asha");
        user.setEmail(email);
        user.setGoogleId(googleId);
        user.setPasswordHash(passwordHash);
        return user;
    }

    @Test
    void aKnownGoogleAccountJustLogsIn() {
        givenGoogleSays("g-1", "asha@example.com", "Asha");
        givenOurTokenCanBeIssued();
        when(userRepository.findByGoogleId("g-1"))
                .thenReturn(Optional.of(account(5L, "asha@example.com", "g-1", null)));

        service.loginWithGoogle(request);

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).save(any(User.class));
        ArgumentCaptor<UserPrincipal> principal = ArgumentCaptor.forClass(UserPrincipal.class);
        verify(jwtService).generateToken(principal.capture());
        assertThat(principal.getValue().getId()).isEqualTo(5L);
    }

    @Test
    void aVerifiedGoogleEmailLinksTheExistingAccountAndClearsItsPassword() {
        User existing = account(7L, "asha@example.com", null, "some-bcrypt-hash");
        givenGoogleSays("g-1", "asha@example.com", "Asha");
        givenOurTokenCanBeIssued();
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("asha@example.com")).thenReturn(Optional.of(existing));

        service.loginWithGoogle(request);

        assertThat(existing.getGoogleId()).isEqualTo("g-1");
        assertThat(existing.getPasswordHash()).isNull();
        assertThat(existing.getAuthProvider()).isEqualTo(AuthProvider.LOCAL);
        verify(userRepository, never()).save(any(User.class));
        ArgumentCaptor<UserPrincipal> principal = ArgumentCaptor.forClass(UserPrincipal.class);
        verify(jwtService).generateToken(principal.capture());
        assertThat(principal.getValue().getId()).isEqualTo(7L);
    }

    @Test
    void anEmailLinkedToADifferentGoogleAccountIsRefused() {
        User existing = account(7L, "asha@example.com", "g-OTHER", null);
        givenGoogleSays("g-1", "asha@example.com", "Asha");
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("asha@example.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.loginWithGoogle(request))
                .isInstanceOf(ConflictException.class);

        assertThat(existing.getGoogleId()).isEqualTo("g-OTHER");
        verifyNoInteractions(jwtService);
    }

    @Test
    void aNewGoogleUserGetsAnAccountWithoutAPassword() {
        givenGoogleSays("g-9", "new@example.com", "New Person");
        givenOurTokenCanBeIssued();
        when(userRepository.findByGoogleId("g-9")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        service.loginWithGoogle(request);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        User created = saved.getValue();
        assertThat(created.getEmail()).isEqualTo("new@example.com");
        assertThat(created.getName()).isEqualTo("New Person");
        assertThat(created.getAuthProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(created.getGoogleId()).isEqualTo("g-9");
        assertThat(created.getPasswordHash()).isNull();
    }

    @Test
    void anInvalidGoogleTokenIsRejectedBeforeAnyDatabaseWork() {
        when(googleTokenVerifier.verify(ID_TOKEN)).thenThrow(new InvalidGoogleTokenException("bad token"));

        assertThatThrownBy(() -> service.loginWithGoogle(request))
                .isInstanceOf(InvalidGoogleTokenException.class);

        verifyNoInteractions(userRepository, jwtService);
    }
}