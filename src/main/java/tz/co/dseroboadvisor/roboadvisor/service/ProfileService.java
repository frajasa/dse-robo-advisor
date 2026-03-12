package tz.co.dseroboadvisor.roboadvisor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.dseroboadvisor.roboadvisor.entity.InvestorProfile;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.InvestmentGoal;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.RiskTolerance;
import tz.co.dseroboadvisor.roboadvisor.exception.DuplicateResourceException;
import tz.co.dseroboadvisor.roboadvisor.exception.InvalidInputException;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.InvestorProfileRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProfileService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileService.class);

    private final InvestorProfileRepository investorProfileRepository;
    private final UserRepository userRepository;

    public ProfileService(InvestorProfileRepository investorProfileRepository,
                          UserRepository userRepository) {
        this.investorProfileRepository = investorProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Optional<InvestorProfile> getProfile(UUID userId) {
        return investorProfileRepository.findByUserId(userId);
    }

    @Transactional
    public InvestorProfile createProfile(UUID userId, Map<String, Object> input) {
        if (investorProfileRepository.findByUserId(userId).isPresent()) {
            throw new DuplicateResourceException("Investor profile already exists. Use updateProfile instead.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        RiskTolerance riskTolerance = parseRiskTolerance(input.get("riskTolerance"));
        InvestmentGoal primaryGoal = parseInvestmentGoal(input.get("primaryGoal"));
        int investmentHorizon = parseInvestmentHorizon(input.get("investmentHorizon"));
        BigDecimal monthlyIncome = parsePositiveDecimal(input.get("monthlyIncome"), "monthlyIncome");
        BigDecimal capitalAvailable = parsePositiveDecimal(input.get("capitalAvailable"), "capitalAvailable");

        InvestorProfile profile = InvestorProfile.builder()
                .user(user)
                .monthlyIncome(monthlyIncome)
                .capitalAvailable(capitalAvailable)
                .riskTolerance(riskTolerance)
                .investmentHorizon(investmentHorizon)
                .primaryGoal(primaryGoal)
                .build();

        logger.debug("Creating investor profile for user {}", userId);
        return investorProfileRepository.save(profile);
    }

    @Transactional
    public InvestorProfile updateProfile(UUID userId, Map<String, Object> input) {
        InvestorProfile profile = investorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Investor profile", userId.toString()));

        if (input.get("monthlyIncome") != null) {
            profile.setMonthlyIncome(parsePositiveDecimal(input.get("monthlyIncome"), "monthlyIncome"));
        }
        if (input.get("capitalAvailable") != null) {
            profile.setCapitalAvailable(parsePositiveDecimal(input.get("capitalAvailable"), "capitalAvailable"));
        }
        if (input.get("riskTolerance") != null) {
            profile.setRiskTolerance(parseRiskTolerance(input.get("riskTolerance")));
        }
        if (input.get("investmentHorizon") != null) {
            profile.setInvestmentHorizon(parseInvestmentHorizon(input.get("investmentHorizon")));
        }
        if (input.get("primaryGoal") != null) {
            profile.setPrimaryGoal(parseInvestmentGoal(input.get("primaryGoal")));
        }

        logger.debug("Updating investor profile for user {}", userId);
        return investorProfileRepository.save(profile);
    }

    private RiskTolerance parseRiskTolerance(Object value) {
        if (value == null) {
            throw new InvalidInputException("riskTolerance is required");
        }
        try {
            return RiskTolerance.valueOf(value.toString());
        } catch (IllegalArgumentException e) {
            throw new InvalidInputException("Invalid riskTolerance. Must be one of: CONSERVATIVE, MODERATE, AGGRESSIVE");
        }
    }

    private InvestmentGoal parseInvestmentGoal(Object value) {
        if (value == null) {
            throw new InvalidInputException("primaryGoal is required");
        }
        try {
            return InvestmentGoal.valueOf(value.toString());
        } catch (IllegalArgumentException e) {
            throw new InvalidInputException("Invalid primaryGoal. Must be one of: RETIREMENT, EDUCATION, WEALTH, INCOME");
        }
    }

    private int parseInvestmentHorizon(Object value) {
        if (value == null) {
            throw new InvalidInputException("investmentHorizon is required");
        }
        int horizon;
        try {
            horizon = ((Number) value).intValue();
        } catch (ClassCastException e) {
            throw new InvalidInputException("investmentHorizon must be a number");
        }
        if (horizon < 1 || horizon > 50) {
            throw new InvalidInputException("investmentHorizon must be between 1 and 50 years");
        }
        return horizon;
    }

    private BigDecimal parsePositiveDecimal(Object value, String fieldName) {
        if (value == null) {
            return null;
        }
        double numValue;
        try {
            numValue = ((Number) value).doubleValue();
        } catch (ClassCastException e) {
            throw new InvalidInputException(fieldName + " must be a number");
        }
        if (numValue < 0) {
            throw new InvalidInputException(fieldName + " must be a positive number");
        }
        if (numValue > 1_000_000_000_000.0) {
            throw new InvalidInputException(fieldName + " exceeds maximum allowed value");
        }
        return BigDecimal.valueOf(numValue);
    }
}
