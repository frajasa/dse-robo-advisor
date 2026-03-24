package tz.co.dseroboadvisor.roboadvisor.dto.analytics;

import java.util.List;

public record PortfolioAnalyticsDTO(
        List<PerformancePointDTO> performanceHistory,
        List<SectorAllocationPointDTO> sectorAllocation,
        List<DividendProjectionPointDTO> dividendProjections,
        double totalValue,
        double totalReturn,
        double totalDividendYield
) {}
