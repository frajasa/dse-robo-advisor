package tz.co.dseroboadvisor.roboadvisor.dto.simulator;

import tz.co.dseroboadvisor.roboadvisor.entity.enums.RiskTolerance;

public record SimulationInputDTO(
        double initialInvestment,
        double monthlyContribution,
        int horizonYears,
        RiskTolerance riskTolerance
) {}
