package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.entity.BrokerReferral;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;
import tz.co.dseroboadvisor.roboadvisor.service.ReferralService;

import java.util.List;
import java.util.Map;

@Controller
public class BrokerReferralController {

    private final ReferralService referralService;
    private final UserRepository userRepository;

    // DSE licensed brokers with affiliate info
    private static final List<Map<String, String>> DSE_BROKERS = List.of(
            Map.of(
                    "name", "Orbit Securities",
                    "description", "Leading Tanzanian stockbroker with online trading platform. Full brokerage services for equities, bonds, and derivatives on the DSE.",
                    "website", "https://www.orbitsecurities.co.tz",
                    "commission", "1.54% per trade",
                    "logo", "orbit",
                    "affiliateUrl", "https://www.orbitsecurities.co.tz/open-account"
            ),
            Map.of(
                    "name", "Zan Securities",
                    "description", "DSE licensed broker offering investment advisory, portfolio management, and share trading services across East Africa.",
                    "website", "https://www.zansecurities.com",
                    "commission", "1.54% per trade",
                    "logo", "zan",
                    "affiliateUrl", "https://www.zansecurities.com/open-account"
            ),
            Map.of(
                    "name", "Vertex International Securities",
                    "description", "Full-service broker providing equity trading, corporate finance advisory, and wealth management on the DSE.",
                    "website", "https://www.vertexsecurities.co.tz",
                    "commission", "1.54% per trade",
                    "logo", "vertex",
                    "affiliateUrl", "https://www.vertexsecurities.co.tz/register"
            ),
            Map.of(
                    "name", "Core Securities",
                    "description", "Tanzanian brokerage firm specializing in equity and fixed income trading with personalized investment advice.",
                    "website", "https://www.coresecurities.co.tz",
                    "commission", "1.54% per trade",
                    "logo", "core",
                    "affiliateUrl", "https://www.coresecurities.co.tz/open-cds"
            ),
            Map.of(
                    "name", "Solomon Stockbrokers",
                    "description", "One of the pioneer stockbroking firms in Tanzania with extensive experience in DSE equity and bond trading.",
                    "website", "https://www.solomonstockbrokers.com",
                    "commission", "1.54% per trade",
                    "logo", "solomon",
                    "affiliateUrl", "https://www.solomonstockbrokers.com/open-account"
            ),
            Map.of(
                    "name", "Tanzania Securities",
                    "description", "Established DSE broker providing retail and institutional brokerage, research, and investment banking services.",
                    "website", "https://www.tanzaniasecurities.co.tz",
                    "commission", "1.54% per trade",
                    "logo", "tsl",
                    "affiliateUrl", "https://www.tanzaniasecurities.co.tz/account"
            )
    );

    public BrokerReferralController(ReferralService referralService,
                                     UserRepository userRepository) {
        this.referralService = referralService;
        this.userRepository = userRepository;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Map<String, String>> brokers() {
        return DSE_BROKERS;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<BrokerReferral> myReferrals() {
        User user = getCurrentUser();
        return referralService.getUserReferrals(user.getId());
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public BrokerReferral createReferral(@Argument String brokerName) {
        User user = getCurrentUser();
        return referralService.createReferral(user.getId(), brokerName);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
    }
}
