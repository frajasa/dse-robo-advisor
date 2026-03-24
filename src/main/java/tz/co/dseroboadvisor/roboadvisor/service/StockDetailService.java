package tz.co.dseroboadvisor.roboadvisor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tz.co.dseroboadvisor.roboadvisor.dto.market.OrderBookEntryDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.market.StockDetailDTO;
import tz.co.dseroboadvisor.roboadvisor.entity.Stock;
import tz.co.dseroboadvisor.roboadvisor.entity.StockPrice;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.StockPriceRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.StockRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class StockDetailService {

    private static final Logger logger = LoggerFactory.getLogger(StockDetailService.class);

    private final StockRepository stockRepository;
    private final StockPriceRepository stockPriceRepository;
    private final WebClient webClient;

    public StockDetailService(StockRepository stockRepository,
                               StockPriceRepository stockPriceRepository,
                               @Value("${app.fastapi.base-url}") String fastapiBaseUrl) {
        this.stockRepository = stockRepository;
        this.stockPriceRepository = stockPriceRepository;
        this.webClient = WebClient.builder().baseUrl(fastapiBaseUrl).build();
    }

    @Cacheable(value = "stockDetail", key = "#symbol")
    public StockDetailDTO getStockDetail(String symbol) {
        Stock stock = stockRepository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Stock", symbol));

        StockPrice latestPrice = stockPriceRepository
                .findTopBySymbolOrderByPriceDateDesc(symbol.toUpperCase())
                .orElse(null);

        Double currentPrice = latestPrice != null && latestPrice.getClosePrice() != null
                ? latestPrice.getClosePrice().doubleValue() : null;
        Double previousClose = latestPrice != null && latestPrice.getOpenPrice() != null
                ? latestPrice.getOpenPrice().doubleValue() : null;
        Double high = latestPrice != null && latestPrice.getHighPrice() != null
                ? latestPrice.getHighPrice().doubleValue() : null;
        Double low = latestPrice != null && latestPrice.getLowPrice() != null
                ? latestPrice.getLowPrice().doubleValue() : null;
        Double bidPrice = latestPrice != null && latestPrice.getBestBidPrice() != null
                ? latestPrice.getBestBidPrice().doubleValue() : null;
        Double askPrice = latestPrice != null && latestPrice.getBestAskPrice() != null
                ? latestPrice.getBestAskPrice().doubleValue() : null;
        Double marketCap = latestPrice != null && latestPrice.getMarketCap() != null
                ? latestPrice.getMarketCap().doubleValue() : null;
        Long volume = latestPrice != null && latestPrice.getVolume() != null
                ? latestPrice.getVolume() : null;

        double change = 0;
        double changePct = 0;
        if (currentPrice != null && previousClose != null && previousClose > 0) {
            change = currentPrice - previousClose;
            changePct = (change / previousClose) * 100;
        }

        // Fetch order book from analytics engine if dseCompanyId is available
        List<OrderBookEntryDTO> orderBook = new ArrayList<>();
        if (stock.getDseCompanyId() != null) {
            orderBook = fetchOrderBook(stock.getDseCompanyId());
        }

        return new StockDetailDTO(
                stock.getSymbol(),
                stock.getCompanyName(),
                stock.getSector(),
                currentPrice,
                previousClose,
                Math.round(change * 100.0) / 100.0,
                Math.round(changePct * 100.0) / 100.0,
                volume,
                high,
                low,
                bidPrice,
                askPrice,
                marketCap,
                stock.getDividendYield() != null ? stock.getDividendYield().doubleValue() : null,
                stock.getExpectedReturn() != null ? stock.getExpectedReturn().doubleValue() : null,
                stock.getVolatility() != null ? stock.getVolatility().doubleValue() : null,
                stock.getDseCompanyId(),
                orderBook
        );
    }

    @SuppressWarnings("unchecked")
    private List<OrderBookEntryDTO> fetchOrderBook(int companyId) {
        try {
            Map<String, Object> response = webClient.get()
                    .uri("/api/v1/order-book/{id}", companyId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            if (response == null || !response.containsKey("orders")) {
                return List.of();
            }

            List<Map<String, Object>> orders = (List<Map<String, Object>>) response.get("orders");
            List<OrderBookEntryDTO> entries = new ArrayList<>();
            for (Map<String, Object> order : orders) {
                entries.add(new OrderBookEntryDTO(
                        ((Number) order.get("buyPrice")).doubleValue(),
                        ((Number) order.get("buyQuantity")).intValue(),
                        ((Number) order.get("sellPrice")).doubleValue(),
                        ((Number) order.get("sellQuantity")).intValue()
                ));
            }
            return entries;
        } catch (Exception e) {
            logger.warn("Failed to fetch order book for company {}: {}", companyId, e.getMessage());
            return List.of();
        }
    }
}
