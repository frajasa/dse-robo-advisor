package tz.co.dseroboadvisor.roboadvisor.dto.portfolio;

import java.util.List;

public record OptimizationResponseDTO(
        List<HoldingDTO> holdings,
        double expectedAnnualReturn,
        double expectedVolatility,
        double sharpeRatio,
        Double projectedDividend
) {
}
