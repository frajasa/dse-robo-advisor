package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "dividend_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DividendHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 10)
    private String symbol;

    @Column(name = "dividend_amount", nullable = false)
    private BigDecimal dividendAmount;

    @Column(name = "ex_date", nullable = false)
    private LocalDate exDate;

    @Column(name = "pay_date")
    private LocalDate payDate;

    @Column(name = "dividend_type", length = 20)
    @Builder.Default
    private String dividendType = "ANNUAL";

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
