package tz.co.dseroboadvisor.roboadvisor.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.client.AnalyticsClient;
import tz.co.dseroboadvisor.roboadvisor.dto.simulator.SimulationProjectionPointDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.simulator.SimulationResultDTO;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.RiskTolerance;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Controller
public class SimulatorController {

    private static final Logger logger = LoggerFactory.getLogger(SimulatorController.class);

    private final AnalyticsClient analyticsClient;

    public SimulatorController(AnalyticsClient analyticsClient) {
        this.analyticsClient = analyticsClient;
    }

    @QueryMapping
    public SimulationResultDTO simulateInvestment(@Argument Map<String, Object> input) {
        double initialInvestment = ((Number) input.get("initialInvestment")).doubleValue();
        double monthlyContribution = ((Number) input.get("monthlyContribution")).doubleValue();
        int horizonYears = ((Number) input.get("horizonYears")).intValue();
        String riskToleranceStr = input.get("riskTolerance").toString();
        RiskTolerance riskTolerance;
        try {
            riskTolerance = RiskTolerance.valueOf(riskToleranceStr);
        } catch (IllegalArgumentException e) {
            riskTolerance = RiskTolerance.MODERATE;
        }

        // Try Python service first
        try {
            SimulationResultDTO result = analyticsClient.simulateInvestment(
                    initialInvestment,
                    monthlyContribution,
                    horizonYears,
                    riskTolerance.name()
            ).block();

            if (result != null) {
                return result;
            }
        } catch (Exception e) {
            logger.warn("Python simulation unavailable, using local fallback: {}", e.getMessage());
        }

        // Fallback: compute locally
        return computeLocalSimulation(initialInvestment, monthlyContribution, horizonYears, riskTolerance);
    }

    private SimulationResultDTO computeLocalSimulation(
            double initialInvestment, double monthlyContribution,
            int horizonYears, RiskTolerance riskTolerance) {

        double expectedReturn;
        double volatility;
        double dividendYield;

        switch (riskTolerance) {
            case CONSERVATIVE -> { expectedReturn = 0.085; volatility = 0.05; dividendYield = 0.075; }
            case AGGRESSIVE -> { expectedReturn = 0.125; volatility = 0.11; dividendYield = 0.055; }
            default -> { expectedReturn = 0.105; volatility = 0.08; dividendYield = 0.065; }
        }

        int months = horizonYears * 12;
        double totalInvested = initialInvestment + (monthlyContribution * months);

        double optRate = (expectedReturn + volatility * 0.75) / 12.0;
        double expRate = expectedReturn / 12.0;
        double pesRate = Math.max(expectedReturn - volatility * 0.75, 0.01) / 12.0;

        List<SimulationProjectionPointDTO> projections = new ArrayList<>();

        for (int year = 0; year <= horizonYears; year++) {
            int month = year * 12;
            double opt = initialInvestment;
            double exp = initialInvestment;
            double pes = initialInvestment;

            for (int m = 1; m <= month; m++) {
                opt = opt * (1 + optRate) + monthlyContribution;
                exp = exp * (1 + expRate) + monthlyContribution;
                pes = pes * (1 + pesRate) + monthlyContribution;
            }

            projections.add(new SimulationProjectionPointDTO(
                    year,
                    Math.round(opt * 100.0) / 100.0,
                    Math.round(exp * 100.0) / 100.0,
                    Math.round(pes * 100.0) / 100.0
            ));
        }

        SimulationProjectionPointDTO last = projections.get(projections.size() - 1);
        double expectedProfit = last.expected() - totalInvested;
        double expectedReturnPct = totalInvested > 0 ? (expectedProfit / totalInvested) * 100 : 0;

        return new SimulationResultDTO(
                projections,
                last.optimistic(),
                last.expected(),
                last.pessimistic(),
                Math.round(totalInvested * 100.0) / 100.0,
                Math.round(expectedProfit * 100.0) / 100.0,
                Math.round(expectedReturnPct * 100.0) / 100.0,
                Math.round(expectedReturn * 10000.0) / 100.0,
                Math.round(last.expected() * dividendYield * 100.0) / 100.0,
                riskTolerance.name().toLowerCase()
        );
    }
}
