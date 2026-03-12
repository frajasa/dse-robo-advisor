package tz.co.dseroboadvisor.roboadvisor.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import tz.co.dseroboadvisor.roboadvisor.dto.portfolio.OptimizationRequestDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.portfolio.OptimizationResponseDTO;

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
}
