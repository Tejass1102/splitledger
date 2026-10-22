package com.splitledger.backend.entity;

import com.splitledger.backend.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    // null for accounts that only sign in with Google
    @Column(name = "password_hash")
    private String passwordHash;

    // how the account was created: LOCAL = email and password, GOOGLE = first sign-in with Google
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    // Google's stable user id ("sub"); null until the account is used with Google.
    // Uniqueness is enforced by the ux_users_google_id index created in pgAdmin.
    @Column(name = "google_id")
    private String googleId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}