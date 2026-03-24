package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.client.AnalyticsClient;
import tz.co.dseroboadvisor.roboadvisor.entity.Portfolio;
import tz.co.dseroboadvisor.roboadvisor.entity.PortfolioHolding;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.PortfolioRepository;

import java.util.*;
import java.util.stream.Collectors;

@Controller
public class RebalancingController {

    private final PortfolioRepository portfolioRepository;
    private final AnalyticsClient analyticsClient;

    public RebalancingController(PortfolioRepository portfolioRepository,
                                  AnalyticsClient analyticsClient) {
        this.portfolioRepository = portfolioRepository;
        this.analyticsClient = analyticsClient;
    }

    @QueryMapping
    public Map<String, Object> portfolioRebalancing(@Argument String portfolioId) {
        Portfolio portfolio = portfolioRepository.findByIdWithHoldings(UUID.fromString(portfolioId))
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", portfolioId));

        List<PortfolioHolding> holdings = portfolio.getHoldings();
        if (holdings == null || holdings.isEmpty()) {
            return Map.of(
                    "needsRebalancing", false,
                    "alerts", List.of(),
                    "portfolioId", portfolioId
            );
        }

        // Build holdings data with simulated current allocations
        List<Map<String, Object>> holdingsData = holdings.stream().map(h -> {
            double target = h.getAllocationPct().doubleValue();
            // Simulate drift (in production, compare with actual market-weighted allocations)
            double current = target * (0.92 + Math.random() * 0.16);
            Map<String, Object> m = new HashMap<>();
            m.put("symbol", h.getSymbol());
            m.put("target_allocation", target);
            m.put("current_allocation", Math.round(current * 100.0) / 100.0);
            return m;
        }).collect(Collectors.toList());

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = analyticsClient.checkRebalancing(holdingsData, 5.0).block();
            if (result != null) {
                result.put("portfolioId", portfolioId);

                // Map Python snake_case to GraphQL camelCase
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> alerts = (List<Map<String, Object>>) result.getOrDefault("alerts", List.of());
                List<Map<String, Object>> mappedAlerts = alerts.stream().map(a -> {
                    Map<String, Object> mapped = new HashMap<>();
                    mapped.put("symbol", a.get("symbol"));
                    mapped.put("name", a.get("name"));
                    mapped.put("action", a.get("action"));
                    mapped.put("currentAllocation", a.get("current_allocation"));
                    mapped.put("targetAllocation", a.get("target_allocation"));
                    mapped.put("drift", a.get("drift"));
                    mapped.put("severity", a.get("severity"));
                    return mapped;
                }).collect(Collectors.toList());
                result.put("alerts", mappedAlerts);
                result.put("needsRebalancing", result.getOrDefault("needs_rebalancing", false));

                return result;
            }
        } catch (Exception e) {
            // Fall through to default
        }

        return Map.of(
                "needsRebalancing", false,
                "alerts", List.of(),
                "portfolioId", portfolioId
        );
    }
}
