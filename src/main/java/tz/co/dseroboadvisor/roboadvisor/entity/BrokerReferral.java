package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "broker_referrals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrokerReferral {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "broker_name", nullable = false)
    private String brokerName;

    @Column(name = "referral_code")
    private String referralCode;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "commission_tzs")
    private BigDecimal commissionTzs;

    @Column(name = "referred_at")
    private OffsetDateTime referredAt;

    @Column(name = "converted_at")
    private OffsetDateTime convertedAt;

    @PrePersist
    protected void onCreate() {
        referredAt = OffsetDateTime.now();
    }
}
