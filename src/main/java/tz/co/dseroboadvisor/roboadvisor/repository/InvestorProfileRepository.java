package tz.co.dseroboadvisor.roboadvisor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.dseroboadvisor.roboadvisor.entity.InvestorProfile;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvestorProfileRepository extends JpaRepository<InvestorProfile, UUID> {
    Optional<InvestorProfile> findByUserId(UUID userId);
}
