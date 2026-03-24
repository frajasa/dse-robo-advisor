package tz.co.dseroboadvisor.roboadvisor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.dseroboadvisor.roboadvisor.client.AnalyticsClient;
import tz.co.dseroboadvisor.roboadvisor.dto.portfolio.HoldingDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.portfolio.OptimizationResponseDTO;
import tz.co.dseroboadvisor.roboadvisor.entity.InvestorProfile;
import tz.co.dseroboadvisor.roboadvisor.entity.Portfolio;
import tz.co.dseroboadvisor.roboadvisor.entity.PortfolioHolding;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.exception.ServiceUnavailableException;
import tz.co.dseroboadvisor.roboadvisor.repository.InvestorProfileRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.PortfolioHoldingRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.PortfolioRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PortfolioService {

    private static final Logger logger = LoggerFactory.getLogger(PortfolioService.class);

    private final PortfolioRepository portfolioRepository;
    private final PortfolioHoldingRepository portfolioHoldingRepository;
    private final UserRepository userRepository;
    private final InvestorProfileRepository investorProfileRepository;
    private final AnalyticsClient analyticsClient;

    public PortfolioService(PortfolioRepository portfolioRepository,
                            PortfolioHoldingRepository portfolioHoldingRepository,
                            UserRepository userRepository,
                            InvestorProfileRepository investorProfileRepository,
                            AnalyticsClient analyticsClient) {
        this.portfolioRepository = portfolioRepository;
        this.portfolioHoldingRepository = portfolioHoldingRepository;
        this.userRepository = userRepository;
        this.investorProfileRepository = investorProfileRepository;
        this.analyticsClient = analyticsClient;
    }

    @Transactional
    public Portfolio generatePortfolio(UUID userId, String name, String riskTolerance) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        InvestorProfile profile = investorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Investor profile", "Please create a profile before generating a portfolio."));

        String effectiveRiskTolerance = riskTolerance != null
                ? riskTolerance
                : profile.getRiskTolerance().name();

        double investmentAmount = profile.getCapitalAvailable() != null
                ? profile.getCapitalAvailable().doubleValue()
                : 0.0;

        String primaryGoal = profile.getPrimaryGoal() != null
                ? profile.getPrimaryGoal().name()
                : null;

        logger.debug("Generating portfolio for user {} with riskTolerance={}, investmentAmount={}, primaryGoal={}",
                userId, effectiveRiskTolerance, investmentAmount, primaryGoal);

        OptimizationResponseDTO optimizationResponse;
        try {
            optimizationResponse = analyticsClient
                    .generatePortfolio(effectiveRiskTolerance, investmentAmount, primaryGoal)
                    .block();
        } catch (Exception e) {
            logger.error("Analytics service call failed for user {}: {}", userId, e.getMessage());
            throw new ServiceUnavailableException("Portfolio optimization service is currently unavailable");
        }

        if (optimizationResponse == null) {
            throw new ServiceUnavailableException("Portfolio optimization service returned no data");
        }

        Portfolio portfolio = Portfolio.builder()
                .user(user)
                .name(name)
                .riskProfile(effectiveRiskTolerance)
                .expectedReturn(BigDecimal.valueOf(optimizationResponse.expectedAnnualReturn()))
                .expectedVolatility(BigDecimal.valueOf(optimizationResponse.expectedVolatility()))
                .sharpeRatio(BigDecimal.valueOf(optimizationResponse.sharpeRatio()))
                .projectedAnnualDividend(optimizationResponse.projectedDividend() != null
                        ? BigDecimal.valueOf(optimizationResponse.projectedDividend()) : null)
                .isActive(true)
                .build();

        portfolio = portfolioRepository.save(portfolio);

        if (optimizationResponse.holdings() != null) {
            for (HoldingDTO holdingDTO : optimizationResponse.holdings()) {
                PortfolioHolding holding = PortfolioHolding.builder()
                        .portfolio(portfolio)
                        .symbol(holdingDTO.symbol())
                        .name(holdingDTO.name())
                        .allocationPct(BigDecimal.valueOf(holdingDTO.allocation()))
                        .dividendYield(BigDecimal.valueOf(holdingDTO.dividendYield()))
                        .sector(holdingDTO.sector())
                        .rationale(holdingDTO.rationale())
                        .build();

                portfolioHoldingRepository.save(holding);
                portfolio.getHoldings().add(holding);
            }
        }

        logger.info("Portfolio '{}' generated with {} holdings for user {}",
                name, portfolio.getHoldings().size(), userId);

        return portfolio;
    }

    @Transactional(readOnly = true)
    public List<Portfolio> getUserPortfolios(UUID userId) {
        return portfolioRepository.findByUserIdAndIsActiveTrueWithHoldings(userId);
    }

    @Transactional(readOnly = true)
    public Optional<Portfolio> getPortfolioById(UUID id) {
        return portfolioRepository.findByIdWithHoldings(id);
    }

    @Transactional
    public boolean deletePortfolio(UUID id) {
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", id.toString()));

        portfolio.setIsActive(false);
        portfolioRepository.save(portfolio);

        logger.info("Portfolio {} soft-deleted", id);
        return true;
    }
}
