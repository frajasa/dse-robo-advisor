package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "portfolio_holdings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioHolding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @Column(nullable = false, length = 10)
    private String symbol;

    @Column(nullable = false)
    private String name;

    @Column(name = "allocation_pct", nullable = false)
    private BigDecimal allocationPct;

    @Column(name = "dividend_yield")
    private BigDecimal dividendYield;

    @Column(length = 50)
    private String sector;

    private String rationale;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
