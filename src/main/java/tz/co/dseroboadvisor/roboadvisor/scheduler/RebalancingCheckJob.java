package tz.co.dseroboadvisor.roboadvisor.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tz.co.dseroboadvisor.roboadvisor.dto.market.RebalancingAlertDTO;
import tz.co.dseroboadvisor.roboadvisor.entity.Portfolio;
import tz.co.dseroboadvisor.roboadvisor.entity.PortfolioHolding;
import tz.co.dseroboadvisor.roboadvisor.repository.PortfolioRepository;
import tz.co.dseroboadvisor.roboadvisor.websocket.AlertBroadcaster;

import java.util.ArrayList;
import java.util.List;

@Component
public class RebalancingCheckJob {

    private static final Logger logger = LoggerFactory.getLogger(RebalancingCheckJob.class);
    private static final double DRIFT_THRESHOLD = 5.0;

    private final PortfolioRepository portfolioRepository;
    private final AlertBroadcaster alertBroadcaster;

    public RebalancingCheckJob(PortfolioRepository portfolioRepository,
                               AlertBroadcaster alertBroadcaster) {
        this.portfolioRepository = portfolioRepository;
        this.alertBroadcaster = alertBroadcaster;
    }

    @Scheduled(cron = "0 0 16 * * MON-FRI", zone = "Africa/Dar_es_Salaam")
    public void checkRebalancing() {
        logger.info("Running daily rebalancing check");
        List<Portfolio> activePortfolios = portfolioRepository.findByIsActiveTrue();

        for (Portfolio portfolio : activePortfolios) {
            List<RebalancingAlertDTO> alerts = checkPortfolioDrift(portfolio);
            if (!alerts.isEmpty()) {
                alertBroadcaster.broadcastRebalancingAlerts(portfolio.getId().toString(), alerts);
            }
        }
    }

    private List<RebalancingAlertDTO> checkPortfolioDrift(Portfolio portfolio) {
        List<RebalancingAlertDTO> alerts = new ArrayList<>();
        List<PortfolioHolding> holdings = portfolio.getHoldings();

        if (holdings == null || holdings.isEmpty()) return alerts;

        for (PortfolioHolding holding : holdings) {
            double targetAllocation = holding.getAllocationPct().doubleValue();
            // Simulate current allocation based on market movements
            // In production, compare target vs actual market-value-weighted allocations
            double currentAllocation = targetAllocation * (0.95 + Math.random() * 0.10);
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
            }
        }

        return alerts;
    }
}
