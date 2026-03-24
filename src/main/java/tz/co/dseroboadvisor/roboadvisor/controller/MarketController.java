package tz.co.dseroboadvisor.roboadvisor.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.dto.market.MarketSnapshotDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.market.MarketTickDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.market.StockDetailDTO;
import tz.co.dseroboadvisor.roboadvisor.service.MarketDataService;
import tz.co.dseroboadvisor.roboadvisor.service.StockDetailService;

import java.time.OffsetDateTime;
import java.util.List;

@Controller
public class MarketController {

    private static final Logger logger = LoggerFactory.getLogger(MarketController.class);

    private final MarketDataService marketDataService;
    private final StockDetailService stockDetailService;

    public MarketController(MarketDataService marketDataService,
                            StockDetailService stockDetailService) {
        this.marketDataService = marketDataService;
        this.stockDetailService = stockDetailService;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public MarketSnapshotDTO marketSnapshot() {
        try {
            MarketSnapshotDTO snapshot = marketDataService.getMarketSnapshot();
            if (snapshot != null) return snapshot;
        } catch (Exception e) {
            logger.warn("Error fetching market snapshot: {}", e.getMessage());
        }
        // Return empty snapshot instead of null
        return new MarketSnapshotDTO(
                List.of(),
                0.0,
                0.0,
                OffsetDateTime.now().toString()
        );
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public StockDetailDTO stockDetail(@Argument String symbol) {
        return stockDetailService.getStockDetail(symbol);
    }
}
