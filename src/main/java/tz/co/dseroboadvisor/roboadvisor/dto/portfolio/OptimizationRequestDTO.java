package tz.co.dseroboadvisor.roboadvisor.dto.portfolio;

public record OptimizationRequestDTO(
        String riskTolerance,
        double investmentAmount,
        String primaryGoal
) {
}
