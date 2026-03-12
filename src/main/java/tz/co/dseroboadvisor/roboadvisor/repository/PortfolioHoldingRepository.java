package tz.co.dseroboadvisor.roboadvisor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.dseroboadvisor.roboadvisor.entity.PortfolioHolding;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortfolioHoldingRepository extends JpaRepository<PortfolioHolding, UUID> {
    List<PortfolioHolding> findByPortfolioId(UUID portfolioId);
}
