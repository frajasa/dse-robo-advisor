package tz.co.dseroboadvisor.roboadvisor.dto.market;

public record RebalancingAlertDTO(
        String portfolioId,
        String symbol,
        double currentAllocation,
        double targetAllocation,
        double drift,
        String action,
        String severity
) {}
