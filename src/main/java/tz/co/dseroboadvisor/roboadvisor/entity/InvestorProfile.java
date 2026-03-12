package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.InvestmentGoal;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.RiskTolerance;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "investor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "monthly_income")
    private BigDecimal monthlyIncome;

    @Column(name = "capital_available")
    private BigDecimal capitalAvailable;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_tolerance", nullable = false)
    private RiskTolerance riskTolerance;

    @Column(name = "investment_horizon", nullable = false)
    private Integer investmentHorizon;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_goal", nullable = false)
    private InvestmentGoal primaryGoal;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
