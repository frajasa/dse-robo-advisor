package tz.co.dseroboadvisor.roboadvisor.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.dseroboadvisor.roboadvisor.entity.Stock;
import tz.co.dseroboadvisor.roboadvisor.repository.StockRepository;

import java.util.List;
import java.util.Optional;

@Service
public class StockService {

    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @Transactional(readOnly = true)
    public List<Stock> getAllActiveStocks() {
        return stockRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public Optional<Stock> getBySymbol(String symbol) {
        return stockRepository.findBySymbol(symbol);
    }
}
