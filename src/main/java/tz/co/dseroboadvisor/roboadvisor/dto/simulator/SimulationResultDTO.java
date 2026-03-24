package tz.co.dseroboadvisor.roboadvisor.dto.simulator;

import java.util.List;

public record SimulationResultDTO(
        List<SimulationProjectionPointDTO> projections,
        double finalOptimistic,
        double finalExpected,
        double finalPessimistic,
        double totalInvested,
        double expectedProfit,
        double expectedReturnPct,
        double expectedAnnualReturn,
        double expectedDividendIncome,
        String riskTolerance
) {}
