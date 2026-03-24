package tz.co.dseroboadvisor.roboadvisor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tz.co.dseroboadvisor.roboadvisor.entity.Portfolio;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, UUID> {
    List<Portfolio> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Portfolio> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndIsActiveTrue(UUID userId);
    List<Portfolio> findByIsActiveTrue();

    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.holdings WHERE p.user.id = :userId AND p.isActive = true ORDER BY p.createdAt DESC")
    List<Portfolio> findByUserIdAndIsActiveTrueWithHoldings(@Param("userId") UUID userId);

    @Query("SELECT p FROM Portfolio p LEFT JOIN FETCH p.holdings WHERE p.id = :id")
    Optional<Portfolio> findByIdWithHoldings(@Param("id") UUID id);
}
