package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.dto.analytics.PortfolioAnalyticsDTO;
import tz.co.dseroboadvisor.roboadvisor.service.AnalyticsService;

import java.util.UUID;

@Controller
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @QueryMapping
    public PortfolioAnalyticsDTO portfolioAnalytics(@Argument String portfolioId) {
        return analyticsService.getPortfolioAnalytics(UUID.fromString(portfolioId));
    }
}
