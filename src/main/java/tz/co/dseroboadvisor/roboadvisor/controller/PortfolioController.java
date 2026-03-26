package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.entity.Portfolio;
import tz.co.dseroboadvisor.roboadvisor.entity.PortfolioHolding;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.exception.AccessDeniedException;
import tz.co.dseroboadvisor.roboadvisor.exception.InvalidInputException;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.PortfolioHoldingRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;
import tz.co.dseroboadvisor.roboadvisor.service.PortfolioService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final PortfolioHoldingRepository portfolioHoldingRepository;
    private final UserRepository userRepository;

    public PortfolioController(PortfolioService portfolioService,
                               PortfolioHoldingRepository portfolioHoldingRepository,
                               UserRepository userRepository) {
        this.portfolioService = portfolioService;
        this.portfolioHoldingRepository = portfolioHoldingRepository;
        this.userRepository = userRepository;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Portfolio> myPortfolios() {
        User user = getCurrentUser();
        return portfolioService.getUserPortfolios(user.getId());
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public Portfolio portfolio(@Argument String id) {
        UUID portfolioId = parseUUID(id);
        return portfolioService.getPortfolioById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", id));
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Portfolio generatePortfolio(@Argument Map<String, Object> input) {
        User user = getCurrentUser();
        String name = (String) input.get("name");
        if (name == null || name.isBlank()) {
            throw new InvalidInputException("Portfolio name is required");
        }
        String riskTolerance = input.get("riskTolerance") != null
                ? (String) input.get("riskTolerance")
                : null;

        return portfolioService.generatePortfolio(user.getId(), name, riskTolerance);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public boolean deletePortfolio(@Argument String id) {
        UUID portfolioId = parseUUID(id);

        User user = getCurrentUser();
        Portfolio portfolio = portfolioService.getPortfolioById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", id));

        if (!portfolio.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to delete this portfolio");
        }

        return portfolioService.deletePortfolio(portfolioId);
    }

    @SchemaMapping(typeName = "Portfolio", field = "holdings")
    public List<PortfolioHolding> holdings(Portfolio portfolio) {
        if (portfolio.getHoldings() != null && !portfolio.getHoldings().isEmpty()) {
            return portfolio.getHoldings();
        }
        return portfolioHoldingRepository.findByPortfolioId(portfolio.getId());
    }

    @SchemaMapping(typeName = "Portfolio", field = "metrics")
    public Map<String, Object> metrics(Portfolio portfolio) {
        List<PortfolioHolding> holdingsList = holdings(portfolio);

        return Map.of(
                "expectedReturn", portfolio.getExpectedReturn() != null
                        ? portfolio.getExpectedReturn().doubleValue() : 0.0,
                "expectedVolatility", portfolio.getExpectedVolatility() != null
                        ? portfolio.getExpectedVolatility().doubleValue() : 0.0,
                "sharpeRatio", portfolio.getSharpeRatio() != null
                        ? portfolio.getSharpeRatio().doubleValue() : 0.0,
                "projectedAnnualDividend", portfolio.getProjectedAnnualDividend() != null
                        ? portfolio.getProjectedAnnualDividend().doubleValue() : 0.0,
                "holdingsCount", holdingsList.size()
        );
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String nickname = authentication.getName();
        return userRepository.findByNickname(nickname)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
    }

    private UUID parseUUID(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new InvalidInputException("Invalid ID format");
        }
    }
}
