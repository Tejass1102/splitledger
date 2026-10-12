package com.splitledger.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "salary_settings")
@Getter @Setter @NoArgsConstructor
public class SalarySetting {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "credit_day", nullable = false)
    private Integer creditDay; // 1-31

    @Column(nullable = false)
    private Boolean active = true;
}