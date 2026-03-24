package tz.co.dseroboadvisor.roboadvisor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.dseroboadvisor.roboadvisor.entity.Subscription;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.SubscriptionTier;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.SubscriptionRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class SubscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Optional<Subscription> getUserSubscription(UUID userId) {
        return subscriptionRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public SubscriptionTier getUserTier(UUID userId) {
        return subscriptionRepository.findByUserId(userId)
                .filter(Subscription::getIsActive)
                .map(Subscription::getTier)
                .orElse(SubscriptionTier.FREE);
    }

    @Transactional
    public Subscription upgradeSubscription(UUID userId, SubscriptionTier tier) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElse(Subscription.builder().user(user).build());

        subscription.setTier(tier);
        subscription.setIsActive(true);
        subscription.setValidFrom(OffsetDateTime.now());

        if (tier == SubscriptionTier.PREMIUM) {
            subscription.setValidUntil(OffsetDateTime.now().plusMonths(1));
        } else if (tier == SubscriptionTier.ENTERPRISE) {
            subscription.setValidUntil(OffsetDateTime.now().plusYears(1));
        }

        subscription = subscriptionRepository.save(subscription);
        logger.info("User {} upgraded to {} tier", userId, tier);
        return subscription;
    }

    @Transactional(readOnly = true)
    public boolean hasFeatureAccess(UUID userId, String feature) {
        SubscriptionTier tier = getUserTier(userId);
        return switch (feature) {
            case "unlimited_portfolios", "live_market_data", "rebalancing_alerts",
                 "advanced_dividends", "analytics_dashboard", "broker_referral" ->
                    tier == SubscriptionTier.PREMIUM || tier == SubscriptionTier.ENTERPRISE;
            case "white_label_api" -> tier == SubscriptionTier.ENTERPRISE;
            default -> true;
        };
    }
}
