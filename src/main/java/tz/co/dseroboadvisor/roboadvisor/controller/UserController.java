package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.entity.InvestorProfile;
import tz.co.dseroboadvisor.roboadvisor.entity.Subscription;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.InvestorProfileRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.SubscriptionRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;

@Controller
public class UserController {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvestorProfileRepository investorProfileRepository;

    public UserController(UserRepository userRepository,
                          SubscriptionRepository subscriptionRepository,
                          InvestorProfileRepository investorProfileRepository) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.investorProfileRepository = investorProfileRepository;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public User me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
    }

    @SchemaMapping(typeName = "User", field = "subscription")
    public Subscription subscription(User user) {
        return subscriptionRepository.findByUserId(user.getId()).orElse(null);
    }

    @SchemaMapping(typeName = "User", field = "profile")
    public InvestorProfile profile(User user) {
        return investorProfileRepository.findByUserId(user.getId()).orElse(null);
    }
}
