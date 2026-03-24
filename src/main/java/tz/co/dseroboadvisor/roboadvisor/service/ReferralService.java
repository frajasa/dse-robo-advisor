package tz.co.dseroboadvisor.roboadvisor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.dseroboadvisor.roboadvisor.entity.BrokerReferral;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.BrokerReferralRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReferralService {

    private static final Logger logger = LoggerFactory.getLogger(ReferralService.class);

    private final BrokerReferralRepository brokerReferralRepository;
    private final UserRepository userRepository;

    public ReferralService(BrokerReferralRepository brokerReferralRepository,
                           UserRepository userRepository) {
        this.brokerReferralRepository = brokerReferralRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BrokerReferral createReferral(UUID userId, String brokerName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        String referralCode = "DSE-" + brokerName.substring(0, Math.min(3, brokerName.length())).toUpperCase()
                + "-" + userId.toString().substring(0, 8).toUpperCase();

        BrokerReferral referral = BrokerReferral.builder()
                .user(user)
                .brokerName(brokerName)
                .referralCode(referralCode)
                .status("PENDING")
                .build();

        referral = brokerReferralRepository.save(referral);
        logger.info("Created referral {} for user {} to broker {}", referralCode, userId, brokerName);
        return referral;
    }

    @Transactional(readOnly = true)
    public List<BrokerReferral> getUserReferrals(UUID userId) {
        return brokerReferralRepository.findByUserId(userId);
    }

    @Transactional
    public BrokerReferral confirmReferral(UUID referralId) {
        BrokerReferral referral = brokerReferralRepository.findById(referralId)
                .orElseThrow(() -> new ResourceNotFoundException("Referral", referralId.toString()));

        referral.setStatus("CONFIRMED");
        referral.setConvertedAt(OffsetDateTime.now());
        return brokerReferralRepository.save(referral);
    }
}
