package tz.co.dseroboadvisor.roboadvisor.entity;

import jakarta.persistence.*;
import lombok.*;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.SubscriptionTier;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubscriptionTier tier = SubscriptionTier.FREE;

    @Column(name = "valid_from")
    private OffsetDateTime validFrom;

    @Column(name = "valid_until")
    private OffsetDateTime validUntil;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "payment_ref")
    private String paymentRef;

    @PrePersist
    protected void onCreate() {
        validFrom = OffsetDateTime.now();
    }
}
