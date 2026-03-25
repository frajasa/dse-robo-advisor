package tz.co.dseroboadvisor.roboadvisor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tz.co.dseroboadvisor.roboadvisor.client.DseMarketClient;
import tz.co.dseroboadvisor.roboadvisor.dto.market.MarketTickDTO;
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
    private final DseMarketClient dseMarketClient;
    private final WebClient webClient;

    public StockDetailService(StockRepository stockRepository,
                               StockPriceRepository stockPriceRepository,
                               DseMarketClient dseMarketClient,
                               @Value("${app.fastapi.base-url}") String fastapiBaseUrl) {
        this.stockRepository = stockRepository;
        this.stockPriceRepository = stockPriceRepository;
        this.dseMarketClient = dseMarketClient;
        this.webClient = WebClient.builder().baseUrl(fastapiBaseUrl).build();
    }

    public StockDetailDTO getStockDetail(String symbol) {
        Stock stock = stockRepository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Stock", symbol));

        // Try live DSE API data first
        MarketTickDTO liveTick = findLiveTick(symbol.toUpperCase());

        Double currentPrice;
        Double previousClose;
        Double high;
        Double low;
        Double bidPrice;
        Double askPrice;
        Double marketCap;
        Long volume;
        double change;
        double changePct;

        if (liveTick != null) {
            currentPrice = liveTick.currentPrice();
            previousClose = liveTick.previousClose();
            high = liveTick.high();
            low = liveTick.low();
            bidPrice = liveTick.bestBidPrice();
            askPrice = liveTick.bestAskPrice();
            marketCap = liveTick.marketCap();
            volume = liveTick.volume();
            change = liveTick.change();
            changePct = liveTick.changePct();
            logger.info("Stock detail for {} served from live DSE API", symbol);
        } else {
            // Fallback to database
            StockPrice latestPrice = stockPriceRepository
                    .findTopBySymbolOrderByPriceDateDesc(symbol.toUpperCase())
                    .orElse(null);

            currentPrice = latestPrice != null && latestPrice.getClosePrice() != null
                    ? latestPrice.getClosePrice().doubleValue() : null;
            previousClose = latestPrice != null && latestPrice.getOpenPrice() != null
                    ? latestPrice.getOpenPrice().doubleValue() : null;
            high = latestPrice != null && latestPrice.getHighPrice() != null
                    ? latestPrice.getHighPrice().doubleValue() : null;
            low = latestPrice != null && latestPrice.getLowPrice() != null
                    ? latestPrice.getLowPrice().doubleValue() : null;
            bidPrice = latestPrice != null && latestPrice.getBestBidPrice() != null
                    ? latestPrice.getBestBidPrice().doubleValue() : null;
            askPrice = latestPrice != null && latestPrice.getBestAskPrice() != null
                    ? latestPrice.getBestAskPrice().doubleValue() : null;
            marketCap = latestPrice != null && latestPrice.getMarketCap() != null
                    ? latestPrice.getMarketCap().doubleValue() : null;
            volume = latestPrice != null && latestPrice.getVolume() != null
                    ? latestPrice.getVolume() : null;

            change = 0;
            changePct = 0;
            if (currentPrice != null && previousClose != null && previousClose > 0) {
                change = currentPrice - previousClose;
                changePct = (change / previousClose) * 100;
            }
            logger.info("Stock detail for {} served from database (API unavailable)", symbol);
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

    private MarketTickDTO findLiveTick(String symbol) {
        try {
            List<MarketTickDTO> ticks = dseMarketClient.fetchLiveMarketData();
            return ticks.stream()
                    .filter(t -> t.symbol().equalsIgnoreCase(symbol))
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            logger.warn("Failed to get live tick for {}: {}", symbol, e.getMessage());
            return null;
        }
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
