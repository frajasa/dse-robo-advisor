package tz.co.dseroboadvisor.roboadvisor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.dseroboadvisor.roboadvisor.entity.Stock;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockRepository extends JpaRepository<Stock, UUID> {
    Optional<Stock> findBySymbol(String symbol);
    List<Stock> findByIsActiveTrue();
}
