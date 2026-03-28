package tz.co.dseroboadvisor.roboadvisor.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tz.co.dseroboadvisor.roboadvisor.dto.market.RebalancingAlertDTO;
import tz.co.dseroboadvisor.roboadvisor.entity.Portfolio;
import tz.co.dseroboadvisor.roboadvisor.entity.PortfolioHolding;
import tz.co.dseroboadvisor.roboadvisor.entity.StockPrice;
import tz.co.dseroboadvisor.roboadvisor.repository.PortfolioRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.StockPriceRepository;
import tz.co.dseroboadvisor.roboadvisor.websocket.AlertBroadcaster;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class RebalancingCheckJob {

    private static final Logger logger = LoggerFactory.getLogger(RebalancingCheckJob.class);
    private static final double DRIFT_THRESHOLD = 5.0;

    private final PortfolioRepository portfolioRepository;
    private final StockPriceRepository stockPriceRepository;
    private final AlertBroadcaster alertBroadcaster;

    public RebalancingCheckJob(PortfolioRepository portfolioRepository,
                               StockPriceRepository stockPriceRepository,
                               AlertBroadcaster alertBroadcaster) {
        this.portfolioRepository = portfolioRepository;
        this.stockPriceRepository = stockPriceRepository;
        this.alertBroadcaster = alertBroadcaster;
    }

    @Scheduled(cron = "0 0 16 * * MON-FRI", zone = "Africa/Dar_es_Salaam")
    public void checkRebalancing() {
        logger.info("Running daily rebalancing check with real price data");

        // Fetch latest prices in a single batch query
        List<StockPrice> latestPrices = stockPriceRepository.findLatestPricesForAllActiveStocks();
        Map<String, BigDecimal> priceMap = new HashMap<>();
        for (StockPrice sp : latestPrices) {
            if (sp.getClosePrice() != null) {
                priceMap.put(sp.getSymbol(), sp.getClosePrice());
            }
        }

        if (priceMap.isEmpty()) {
            logger.warn("No price data available — skipping rebalancing check");
            return;
        }

        List<Portfolio> activePortfolios = portfolioRepository.findByIsActiveTrue();
        int totalAlerts = 0;

        for (Portfolio portfolio : activePortfolios) {
            List<RebalancingAlertDTO> alerts = checkPortfolioDrift(portfolio, priceMap);
            if (!alerts.isEmpty()) {
                alertBroadcaster.broadcastRebalancingAlerts(portfolio.getId().toString(), alerts);
                totalAlerts += alerts.size();
            }
        }

        logger.info("Rebalancing check complete: {} portfolios checked, {} alerts generated",
                activePortfolios.size(), totalAlerts);
    }

    private List<RebalancingAlertDTO> checkPortfolioDrift(Portfolio portfolio, Map<String, BigDecimal> priceMap) {
        List<RebalancingAlertDTO> alerts = new ArrayList<>();
        List<PortfolioHolding> holdings = portfolio.getHoldings();

        if (holdings == null || holdings.isEmpty()) return alerts;

        // Step 1: Compute each holding's current market value based on price changes
        // We use the ratio of current price to a baseline to estimate drift.
        // Since we don't track purchase prices, we compute relative price movement
        // to determine how allocations have drifted from their targets.

        // First, compute the weighted price change for each holding
        double totalWeightedValue = 0.0;
        Map<String, Double> holdingValues = new HashMap<>();

        for (PortfolioHolding holding : holdings) {
            BigDecimal currentPrice = priceMap.get(holding.getSymbol());
            double targetPct = holding.getAllocationPct().doubleValue();

            if (currentPrice != null && currentPrice.compareTo(BigDecimal.ZERO) > 0) {
                // Use allocation * price as a proxy for current value weight
                // Higher-priced stocks that went up will have grown their allocation
                double value = targetPct * currentPrice.doubleValue();
                holdingValues.put(holding.getSymbol(), value);
                totalWeightedValue += value;
            } else {
                // No price data — assume no drift for this holding
                holdingValues.put(holding.getSymbol(), targetPct);
                totalWeightedValue += targetPct;
            }
        }

        if (totalWeightedValue <= 0) return alerts;

        // Step 2: Compute current allocation % and drift
        for (PortfolioHolding holding : holdings) {
            double targetAllocation = holding.getAllocationPct().doubleValue();
            double currentValue = holdingValues.getOrDefault(holding.getSymbol(), targetAllocation);
            double currentAllocation = (currentValue / totalWeightedValue) * 100.0;
            double drift = Math.abs(currentAllocation - targetAllocation);

            if (drift > DRIFT_THRESHOLD) {
                String action = currentAllocation > targetAllocation ? "SELL" : "BUY";
                String severity = drift > 10.0 ? "HIGH" : "MEDIUM";

                alerts.add(new RebalancingAlertDTO(
                        portfolio.getId().toString(),
                        holding.getSymbol(),
                        Math.round(currentAllocation * 100.0) / 100.0,
                        targetAllocation,
                        Math.round(drift * 100.0) / 100.0,
                        action,
                        severity
                ));

                logger.debug("Drift alert: {} {} drift={:.2f}% (current={:.1f}% target={:.1f}%)",
                        holding.getSymbol(), action, drift, currentAllocation, targetAllocation);
            }
        }

        return alerts;
    }
}
