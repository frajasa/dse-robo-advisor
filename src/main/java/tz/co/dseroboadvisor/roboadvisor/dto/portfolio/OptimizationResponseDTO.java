package tz.co.dseroboadvisor.roboadvisor.dto.portfolio;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record OptimizationResponseDTO(
        List<HoldingDTO> holdings,
        @JsonProperty("expected_annual_return") double expectedAnnualReturn,
        @JsonProperty("expected_volatility") double expectedVolatility,
        @JsonProperty("sharpe_ratio") double sharpeRatio,
        @JsonProperty("projected_dividend") Double projectedDividend
) {
}
