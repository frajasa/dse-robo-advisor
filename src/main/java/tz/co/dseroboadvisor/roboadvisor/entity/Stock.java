package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 10)
    private String symbol;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(length = 50)
    private String sector;

    @Column(name = "expected_return")
    private BigDecimal expectedReturn;

    private BigDecimal volatility;

    @Column(name = "dividend_yield")
    private BigDecimal dividendYield;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "listed_date")
    private LocalDate listedDate;

    @Column(name = "market_cap")
    private BigDecimal marketCap;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
