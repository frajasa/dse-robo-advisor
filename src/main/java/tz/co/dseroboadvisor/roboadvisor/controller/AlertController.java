package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.entity.Notification;
import tz.co.dseroboadvisor.roboadvisor.entity.PriceAlert;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;
import tz.co.dseroboadvisor.roboadvisor.service.AlertService;

import java.util.List;
import java.util.UUID;

@Controller
public class AlertController {

    private final AlertService alertService;
    private final UserRepository userRepository;

    public AlertController(AlertService alertService, UserRepository userRepository) {
        this.alertService = alertService;
        this.userRepository = userRepository;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<PriceAlert> myAlerts() {
        return alertService.getUserAlerts(getCurrentUser().getId());
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Notification> myNotifications() {
        return alertService.getUserNotifications(getCurrentUser().getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public PriceAlert createPriceAlert(@Argument String symbol,
                                        @Argument double targetPrice,
                                        @Argument String direction) {
        return alertService.createPriceAlert(
                getCurrentUser().getId(), symbol, targetPrice, direction);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public boolean deletePriceAlert(@Argument String id) {
        return alertService.deletePriceAlert(UUID.fromString(id), getCurrentUser().getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public boolean markNotificationRead(@Argument String id) {
        return alertService.markNotificationRead(UUID.fromString(id), getCurrentUser().getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public boolean markAllNotificationsRead() {
        return alertService.markAllNotificationsRead(getCurrentUser().getId());
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String nickname = authentication.getName();
        return userRepository.findByNickname(nickname)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
    }
}
