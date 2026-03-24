package tz.co.dseroboadvisor.roboadvisor.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.client.AnalyticsClient;

import java.util.List;
import java.util.Map;

@Controller
public class AiAdvisorController {

    private static final Logger logger = LoggerFactory.getLogger(AiAdvisorController.class);

    private final AnalyticsClient analyticsClient;

    public AiAdvisorController(AnalyticsClient analyticsClient) {
        this.analyticsClient = analyticsClient;
    }

    @SuppressWarnings("unchecked")
    @QueryMapping
    public Map<String, Object> askAdvisor(@Argument String question) {
        try {
            Map<String, Object> result = analyticsClient.askAiAdvisor(question).block();
            if (result != null) {
                result.put("relatedPages", result.getOrDefault("related_pages", List.of()));
                return result;
            }
        } catch (Exception e) {
            logger.error("Error calling AI advisor: {}", e.getMessage());
        }

        // Fallback response when Python service is unavailable
        return Map.of(
                "answer", "I can help you with questions about investing on the DSE. "
                        + "Try asking about dividends, risk tolerance, rebalancing, or how to get started. "
                        + "Visit the **Learn** page for educational content.",
                "source", "fallback",
                "relatedPages", List.of("/learn", "/advisor")
        );
    }
}
