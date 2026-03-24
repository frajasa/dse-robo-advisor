package tz.co.dseroboadvisor.roboadvisor.dto.portfolio;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OptimizationRequestDTO(
        @JsonProperty("risk_tolerance") String riskTolerance,
        @JsonProperty("investment_amount") double investmentAmount,
        @JsonProperty("primary_goal") String primaryGoal
) {
}
