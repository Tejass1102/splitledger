package com.splitledger.backend.entity;

import com.splitledger.backend.enums.SalaryCycleStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "salary_cycles",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "month"}))
@Getter @Setter @NoArgsConstructor
public class SalaryCycle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate month; // first day of the month

    @Column(name = "credit_date", nullable = false)
    private LocalDate creditDate;

    @Column(name = "expected_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SalaryCycleStatus status = SalaryCycleStatus.PENDING;

    @Column(name = "prompts_sent", nullable = false)
    private Integer promptsSent = 0;

    @Column(name = "last_prompted_on")
    private LocalDate lastPromptedOn;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "income_id")
    private Income income;
}