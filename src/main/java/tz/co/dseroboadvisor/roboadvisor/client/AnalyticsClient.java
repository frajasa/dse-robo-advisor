package tz.co.dseroboadvisor.roboadvisor.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import tz.co.dseroboadvisor.roboadvisor.dto.portfolio.OptimizationRequestDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.portfolio.OptimizationResponseDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.simulator.SimulationResultDTO;

import java.util.Map;

@Component
public class AnalyticsClient {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsClient.class);

    private final WebClient analyticsWebClient;

    public AnalyticsClient(WebClient analyticsWebClient) {
        this.analyticsWebClient = analyticsWebClient;
    }

    public Mono<OptimizationResponseDTO> generatePortfolio(String riskTolerance,
                                                            double investmentAmount,
                                                            String primaryGoal) {
        OptimizationRequestDTO request = new OptimizationRequestDTO(
                riskTolerance,
                investmentAmount,
                primaryGoal
        );

        logger.debug("Calling FastAPI optimization endpoint with riskTolerance={}, investmentAmount={}, primaryGoal={}",
                riskTolerance, investmentAmount, primaryGoal);

        return analyticsWebClient.post()
                .uri("/api/v1/optimize")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OptimizationResponseDTO.class)
                .doOnSuccess(response -> logger.debug("Received optimization response with {} holdings",
                        response != null && response.holdings() != null ? response.holdings().size() : 0))
                .doOnError(error -> logger.error("Error calling FastAPI optimization endpoint: {}",
                        error.getMessage()));
    }

    public Mono<SimulationResultDTO> simulateInvestment(double initialInvestment,
                                                         double monthlyContribution,
                                                         int horizonYears,
                                                         String riskTolerance) {
        Map<String, Object> request = Map.of(
                "initial_investment", initialInvestment,
                "monthly_contribution", monthlyContribution,
                "horizon_years", horizonYears,
                "risk_tolerance", riskTolerance.toLowerCase()
        );

        logger.debug("Calling FastAPI simulation endpoint");

        return analyticsWebClient.post()
                .uri("/api/v1/analytics/simulate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SimulationResultDTO.class)
                .doOnError(error -> logger.error("Error calling simulation endpoint: {}",
                        error.getMessage()));
    }

    public Mono<Map> askAiAdvisor(String question) {
        Map<String, Object> request = Map.of("question", question);

        return analyticsWebClient.post()
                .uri("/api/v1/analytics/ai/ask")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnError(error -> logger.error("Error calling AI advisor endpoint: {}",
                        error.getMessage()));
    }

    public Mono<Map> checkRebalancing(java.util.List<Map<String, Object>> holdings, double driftThreshold) {
        Map<String, Object> request = Map.of(
                "holdings", holdings,
                "drift_threshold", driftThreshold
        );

        return analyticsWebClient.post()
                .uri("/api/v1/analytics/rebalance/check")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnError(error -> logger.error("Error calling rebalance endpoint: {}",
                        error.getMessage()));
    }
}
