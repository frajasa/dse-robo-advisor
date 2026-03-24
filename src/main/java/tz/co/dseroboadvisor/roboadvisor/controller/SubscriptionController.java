package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.entity.Subscription;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.SubscriptionTier;
import tz.co.dseroboadvisor.roboadvisor.exception.InvalidInputException;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;
import tz.co.dseroboadvisor.roboadvisor.service.SubscriptionService;

@Controller
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;

    public SubscriptionController(SubscriptionService subscriptionService,
                                   UserRepository userRepository) {
        this.subscriptionService = subscriptionService;
        this.userRepository = userRepository;
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Subscription upgradeSubscription(@Argument String tier) {
        User user = getCurrentUser();
        SubscriptionTier subscriptionTier;
        try {
            subscriptionTier = SubscriptionTier.valueOf(tier);
        } catch (IllegalArgumentException e) {
            throw new InvalidInputException("Invalid subscription tier: " + tier);
        }
        return subscriptionService.upgradeSubscription(user.getId(), subscriptionTier);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
    }
}
