package com.splitledger.backend.security;

import com.splitledger.backend.exception.InvalidGoogleTokenException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Verifies a Google ID token: signature (Google's public keys), expiry, issuer and,
 * most importantly, that the token was issued for OUR client id.
 */
@Slf4j
@Component
public class GoogleTokenVerifier {
    private static final String GOOGLE_KEYS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> GOOGLE_ISSUERS =
            Set.of("https://accounts.google.com", "accounts.google.com");
    private static final int MAX_NAME_LENGTH = 100;

    private final JwtDecoder decoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id}") String clientId) {
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException("app.google.client-id (env GOOGLE_CLIENT_ID) must be set");
        }
        NimbusJwtDecoder nimbus = NimbusJwtDecoder.withJwkSetUri(GOOGLE_KEYS_URL)
                .jwsAlgorithm(SignatureAlgorithm.RS256)
                .build();
        OAuth2TokenValidator<Jwt> issuer = issuerValidator();
        OAuth2TokenValidator<Jwt> audience = audienceValidator(clientId);
        nimbus.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(), issuer, audience));
        this.decoder = nimbus;
    }

    /** Returns the verified identity, or throws InvalidGoogleTokenException (401). */
    public GoogleIdentity verify(String idToken) {
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException e) {
            // the reason goes to the log only, never to the caller
            log.warn("Google ID token rejected: {}", e.getMessage());
            throw new InvalidGoogleTokenException("The Google sign-in token is not valid");
        }

        if (!Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))) {
            log.warn("Google sign-in refused: the Google account's email is not verified");
            throw new InvalidGoogleTokenException("The Google account's email is not verified");
        }
        String googleId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        if (googleId == null || googleId.isBlank() || email == null || email.isBlank()) {
            log.warn("Google sign-in refused: the token has no subject or no email");
            throw new InvalidGoogleTokenException("The Google token is missing required details");
        }
        email = email.trim().toLowerCase(Locale.ROOT);

        String name = jwt.getClaimAsString("name");
        if (name == null || name.isBlank()) {
            int at = email.indexOf('@');
            name = at > 0 ? email.substring(0, at) : email;
        }
        name = name.trim();
        if (name.length() > MAX_NAME_LENGTH) {
            name = name.substring(0, MAX_NAME_LENGTH);
        }
        return new GoogleIdentity(googleId, email, name);
    }

    // Google uses both spellings of its issuer
    private static OAuth2TokenValidator<Jwt> issuerValidator() {
        return jwt -> GOOGLE_ISSUERS.contains(jwt.getClaimAsString("iss"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Wrong token issuer", null));
    }

    // The token must have been issued for this application, not for some other Google app
    private static OAuth2TokenValidator<Jwt> audienceValidator(String clientId) {
        return jwt -> {
            List<String> audience = jwt.getAudience();
            return audience != null && audience.contains(clientId)
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "Wrong token audience", null));
        };
    }
}