package tz.co.dseroboadvisor.roboadvisor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tz.co.dseroboadvisor.roboadvisor.entity.DividendHistory;

import java.util.List;
import java.util.UUID;

@Repository
public interface DividendHistoryRepository extends JpaRepository<DividendHistory, UUID> {
    List<DividendHistory> findBySymbolOrderByExDateDesc(String symbol);
}
