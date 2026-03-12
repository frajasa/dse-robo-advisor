package tz.co.dseroboadvisor.roboadvisor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.dseroboadvisor.roboadvisor.entity.StockPrice;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockPriceRepository extends JpaRepository<StockPrice, UUID> {
    Optional<StockPrice> findTopBySymbolOrderByPriceDateDesc(String symbol);
    List<StockPrice> findBySymbolAndPriceDateBetweenOrderByPriceDateAsc(String symbol, LocalDate start, LocalDate end);
}
