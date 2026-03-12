package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.entity.Stock;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.service.StockService;

import java.util.List;

@Controller
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Stock> stocks() {
        return stockService.getAllActiveStocks();
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public Stock stock(@Argument String symbol) {
        return stockService.getBySymbol(symbol)
                .orElseThrow(() -> new ResourceNotFoundException("Stock", symbol));
    }
}
