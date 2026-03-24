package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "price_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String symbol;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "target_price", nullable = false)
    private BigDecimal targetPrice;

    @Column(nullable = false, length = 10)
    private String direction; // ABOVE or BELOW

    @Column(name = "is_triggered")
    private boolean isTriggered;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "triggered_at")
    private OffsetDateTime triggeredAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        isTriggered = false;
    }
}
