package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "portfolios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "risk_profile", nullable = false)
    private String riskProfile;

    @Column(name = "expected_return")
    private BigDecimal expectedReturn;

    @Column(name = "expected_volatility")
    private BigDecimal expectedVolatility;

    @Column(name = "sharpe_ratio")
    private BigDecimal sharpeRatio;

    @Column(name = "projected_annual_dividend")
    private BigDecimal projectedAnnualDividend;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "last_rebalanced")
    private OffsetDateTime lastRebalanced;

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PortfolioHolding> holdings = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
