package tz.co.dseroboadvisor.roboadvisor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.dseroboadvisor.roboadvisor.entity.Portfolio;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, UUID> {
    List<Portfolio> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Portfolio> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndIsActiveTrue(UUID userId);
}
