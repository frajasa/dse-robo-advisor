package tz.co.dseroboadvisor.roboadvisor.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import tz.co.dseroboadvisor.roboadvisor.dto.analytics.DividendProjectionPointDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.analytics.PerformancePointDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.analytics.PortfolioAnalyticsDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.analytics.SectorAllocationPointDTO;
import tz.co.dseroboadvisor.roboadvisor.entity.InvestorProfile;
import tz.co.dseroboadvisor.roboadvisor.entity.Portfolio;
import tz.co.dseroboadvisor.roboadvisor.entity.PortfolioHolding;
import tz.co.dseroboadvisor.roboadvisor.entity.StockPrice;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.InvestorProfileRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.PortfolioRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.StockPriceRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final PortfolioRepository portfolioRepository;
    private final StockPriceRepository stockPriceRepository;
    private final InvestorProfileRepository investorProfileRepository;

    public AnalyticsService(PortfolioRepository portfolioRepository,
                            StockPriceRepository stockPriceRepository,
                            InvestorProfileRepository investorProfileRepository) {
        this.portfolioRepository = portfolioRepository;
        this.stockPriceRepository = stockPriceRepository;
        this.investorProfileRepository = investorProfileRepository;
    }

    @Cacheable(value = "portfolioAnalytics", key = "#portfolioId")
    public PortfolioAnalyticsDTO getPortfolioAnalytics(UUID portfolioId) {
        Portfolio portfolio = portfolioRepository.findByIdWithHoldings(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", portfolioId.toString()));

        List<PortfolioHolding> holdings = portfolio.getHoldings();

        // Get the user's actual capital from their investor profile
        double baseCapital = 10_000_000;
        try {
            InvestorProfile profile = investorProfileRepository
                    .findByUserId(portfolio.getUser().getId()).orElse(null);
            if (profile != null && profile.getCapitalAvailable() != null
                    && profile.getCapitalAvailable().doubleValue() > 0) {
                baseCapital = profile.getCapitalAvailable().doubleValue();
            }
        } catch (Exception ignored) {
            // fallback to default
        }

        // Get portfolio-specific metrics
        double expectedReturn = portfolio.getExpectedReturn() != null
                ? portfolio.getExpectedReturn().doubleValue() : 0.08;
        double expectedVolatility = portfolio.getExpectedVolatility() != null
                ? portfolio.getExpectedVolatility().doubleValue() : 0.10;

        List<PerformancePointDTO> performanceHistory =
                computePerformanceHistory(holdings, baseCapital, expectedReturn, expectedVolatility, portfolio.getCreatedAt());
        List<SectorAllocationPointDTO> sectorAllocation = computeSectorAllocation(holdings);
        List<DividendProjectionPointDTO> dividendProjections = computeDividendProjections(holdings, baseCapital);

        double totalDividendYield = holdings.stream()
                .mapToDouble(h -> {
                    double yield_ = h.getDividendYield() != null ? h.getDividendYield().doubleValue() : 0.0;
                    double alloc = h.getAllocationPct() != null ? h.getAllocationPct().doubleValue() / 100.0 : 0.0;
                    return yield_ * alloc;
                })
                .sum();

        double totalValue = baseCapital;
        if (!performanceHistory.isEmpty()) {
            totalValue = performanceHistory.get(performanceHistory.size() - 1).value();
        }

        return new PortfolioAnalyticsDTO(
                performanceHistory,
                sectorAllocation,
                dividendProjections,
                Math.round(totalValue * 100.0) / 100.0,
                Math.round(expectedReturn * 10000.0) / 10000.0,
                Math.round(totalDividendYield * 10000.0) / 10000.0
        );
    }

    private List<PerformancePointDTO> computePerformanceHistory(
            List<PortfolioHolding> holdings,
            double baseCapital,
            double expectedReturn,
            double expectedVolatility,
            java.time.OffsetDateTime createdAt) {

        if (holdings.isEmpty()) return List.of();

        LocalDate end = LocalDate.now();
        LocalDate start = end.minusMonths(12);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");

        // Try to use real price data
        Map<String, List<StockPrice>> pricesBySymbol = new HashMap<>();
        int maxDaysForAnySymbol = 0;
        for (PortfolioHolding h : holdings) {
            List<StockPrice> prices = stockPriceRepository
                    .findBySymbolAndPriceDateBetweenOrderByPriceDateAsc(h.getSymbol(), start, end);
            if (!prices.isEmpty()) {
                pricesBySymbol.put(h.getSymbol(), prices);
                maxDaysForAnySymbol = Math.max(maxDaysForAnySymbol, prices.size());
            }
        }

        // Need at least 2 symbols with 30+ days of history for meaningful real charts
        if (pricesBySymbol.size() >= 2 && maxDaysForAnySymbol >= 30) {
            return computeRealPerformance(holdings, pricesBySymbol, baseCapital, start, end, fmt);
        }

        // Otherwise, simulate performance using portfolio's expected return + volatility
        return simulatePerformance(baseCapital, expectedReturn, expectedVolatility, start, end, fmt, createdAt);
    }

    private List<PerformancePointDTO> computeRealPerformance(
            List<PortfolioHolding> holdings,
            Map<String, List<StockPrice>> pricesBySymbol,
            double baseCapital,
            LocalDate start, LocalDate end,
            DateTimeFormatter fmt) {

        List<PerformancePointDTO> points = new ArrayList<>();

        for (int i = 0; i <= 12; i++) {
            LocalDate month = start.plusMonths(i);
            double portfolioMultiplier = 0.0;
            double totalWeight = 0.0;

            for (PortfolioHolding h : holdings) {
                double alloc = h.getAllocationPct() != null ? h.getAllocationPct().doubleValue() / 100.0 : 0.0;
                List<StockPrice> prices = pricesBySymbol.get(h.getSymbol());
                if (prices == null || prices.isEmpty()) continue;

                BigDecimal basePrice = prices.get(0).getClosePrice();
                BigDecimal monthPrice = basePrice;
                for (StockPrice sp : prices) {
                    if (!sp.getPriceDate().isAfter(month.plusMonths(1).withDayOfMonth(1))) {
                        monthPrice = sp.getClosePrice() != null ? sp.getClosePrice() : monthPrice;
                    }
                }

                if (basePrice != null && basePrice.doubleValue() > 0 && monthPrice != null) {
                    double returnRatio = monthPrice.doubleValue() / basePrice.doubleValue();
                    portfolioMultiplier += alloc * returnRatio;
                    totalWeight += alloc;
                }
            }

            if (totalWeight > 0) {
                double normalizedMultiplier = portfolioMultiplier / totalWeight;
                double value = baseCapital * normalizedMultiplier;
                points.add(new PerformancePointDTO(month.format(fmt), Math.round(value * 100.0) / 100.0));
            }
        }

        return points;
    }

    private List<PerformancePointDTO> simulatePerformance(
            double baseCapital,
            double expectedReturn,
            double expectedVolatility,
            LocalDate start, LocalDate end,
            DateTimeFormatter fmt,
            java.time.OffsetDateTime createdAt) {

        List<PerformancePointDTO> points = new ArrayList<>();

        // Use a seeded random based on portfolio creation time for consistency
        long seed = createdAt != null ? createdAt.toEpochSecond() : System.currentTimeMillis();
        Random rng = new Random(seed);

        double monthlyReturn = expectedReturn / 12.0;
        double monthlyVol = expectedVolatility / Math.sqrt(12.0);
        double currentValue = baseCapital;

        for (int i = 0; i <= 12; i++) {
            LocalDate month = start.plusMonths(i);

            if (i > 0) {
                // Simulate with geometric Brownian motion using portfolio-specific params
                double shock = rng.nextGaussian() * monthlyVol;
                double monthReturn = monthlyReturn + shock;
                currentValue *= (1.0 + monthReturn);
            }

            points.add(new PerformancePointDTO(
                    month.format(fmt),
                    Math.round(currentValue * 100.0) / 100.0
            ));
        }

        return points;
    }

    private List<SectorAllocationPointDTO> computeSectorAllocation(List<PortfolioHolding> holdings) {
        Map<String, Double> sectorMap = holdings.stream()
                .collect(Collectors.groupingBy(
                        h -> h.getSector() != null ? h.getSector() : "Other",
                        Collectors.summingDouble(h ->
                                h.getAllocationPct() != null ? h.getAllocationPct().doubleValue() : 0.0)
                ));

        return sectorMap.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .map(e -> new SectorAllocationPointDTO(e.getKey(), Math.round(e.getValue() * 100.0) / 100.0))
                .collect(Collectors.toList());
    }

    private List<DividendProjectionPointDTO> computeDividendProjections(
            List<PortfolioHolding> holdings, double baseCapital) {

        double totalAnnualDividendYield = holdings.stream()
                .mapToDouble(h -> {
                    double yield_ = h.getDividendYield() != null ? h.getDividendYield().doubleValue() : 0.0;
                    double alloc = h.getAllocationPct() != null ? h.getAllocationPct().doubleValue() / 100.0 : 0.0;
                    return yield_ * alloc;
                })
                .sum();

        double annualDividend = baseCapital * (totalAnnualDividendYield / 100.0);

        List<DividendProjectionPointDTO> projections = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 1; i <= 12; i++) {
            LocalDate month = now.plusMonths(i);
            String monthName = month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + month.getYear();

            // Weight dividends: higher in Jun/Dec (typical DSE payout months)
            double weight;
            int m = month.getMonthValue();
            if (m == 6 || m == 12) {
                weight = 3.0;
            } else if (m == 3 || m == 9) {
                weight = 1.5;
            } else {
                weight = 0.5;
            }

            double totalWeight = (3.0 * 2) + (1.5 * 2) + (0.5 * 8); // = 13
            double monthlyDividend = annualDividend * (weight / totalWeight);
            projections.add(new DividendProjectionPointDTO(monthName, Math.round(monthlyDividend * 100.0) / 100.0));
        }

        return projections;
    }
}
