package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_prices", uniqueConstraints = @UniqueConstraint(columnNames = {"symbol", "price_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 10)
    private String symbol;

    @Column(name = "open_price")
    private BigDecimal openPrice;

    @Column(name = "close_price")
    private BigDecimal closePrice;

    @Column(name = "high_price")
    private BigDecimal highPrice;

    @Column(name = "low_price")
    private BigDecimal lowPrice;

    private Long volume;

    @Column(name = "price_date", nullable = false)
    private LocalDate priceDate;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
