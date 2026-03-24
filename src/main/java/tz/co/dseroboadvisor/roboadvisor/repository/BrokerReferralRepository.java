package tz.co.dseroboadvisor.roboadvisor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.dseroboadvisor.roboadvisor.entity.BrokerReferral;

import java.util.List;
import java.util.UUID;

@Repository
public interface BrokerReferralRepository extends JpaRepository<BrokerReferral, UUID> {
    List<BrokerReferral> findByUserId(UUID userId);
}
