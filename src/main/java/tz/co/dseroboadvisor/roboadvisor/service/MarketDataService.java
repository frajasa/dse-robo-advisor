package tz.co.dseroboadvisor.roboadvisor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tz.co.dseroboadvisor.roboadvisor.client.DseMarketClient;
import tz.co.dseroboadvisor.roboadvisor.dto.market.MarketSnapshotDTO;
import tz.co.dseroboadvisor.roboadvisor.dto.market.MarketTickDTO;
import tz.co.dseroboadvisor.roboadvisor.entity.StockPrice;
import tz.co.dseroboadvisor.roboadvisor.repository.StockPriceRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.StockRepository;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MarketDataService {

    private static final Logger logger = LoggerFactory.getLogger(MarketDataService.class);
    private static final String PRICE_KEY_PREFIX = "price:";

    private final StockRepository stockRepository;
    private final StockPriceRepository stockPriceRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final DseMarketClient dseMarketClient;

    public MarketDataService(StockRepository stockRepository,
                             StockPriceRepository stockPriceRepository,
                             RedisTemplate<String, Object> redisTemplate,
                             DseMarketClient dseMarketClient) {
        this.stockRepository = stockRepository;
        this.stockPriceRepository = stockPriceRepository;
        this.redisTemplate = redisTemplate;
        this.dseMarketClient = dseMarketClient;
    }

    public List<MarketTickDTO> getLatestPrices() {
        // Single query: fetch all active stocks for name lookup
        Map<String, String> stockNames = new HashMap<>();
        stockRepository.findByIsActiveTrue().forEach(s -> stockNames.put(s.getSymbol(), s.getCompanyName()));

        // Single query: fetch latest price for all active symbols
        List<StockPrice> latestPrices = stockPriceRepository.findLatestPricesForAllActiveStocks();
        List<MarketTickDTO> ticks = new ArrayList<>();
        Map<String, Object> cacheEntries = new HashMap<>();

        for (StockPrice sp : latestPrices) {
            double currentPrice = sp.getClosePrice() != null ? sp.getClosePrice().doubleValue() : 0.0;
            double previousClose = sp.getOpenPrice() != null ? sp.getOpenPrice().doubleValue() : currentPrice;
            double change = currentPrice - previousClose;
            double changePct = previousClose > 0 ? (change / previousClose) * 100 : 0.0;

            double high = sp.getHighPrice() != null ? sp.getHighPrice().doubleValue() : currentPrice;
            double low = sp.getLowPrice() != null ? sp.getLowPrice().doubleValue() : currentPrice;
            Double bidPrice = sp.getBestBidPrice() != null ? sp.getBestBidPrice().doubleValue() : null;
            Double askPrice = sp.getBestAskPrice() != null ? sp.getBestAskPrice().doubleValue() : null;
            Double marketCap = sp.getMarketCap() != null ? sp.getMarketCap().doubleValue() : null;

            String name = stockNames.getOrDefault(sp.getSymbol(), sp.getSymbol());

            MarketTickDTO tick = new MarketTickDTO(
                    sp.getSymbol(),
                    name,
                    currentPrice,
                    previousClose,
                    Math.round(change * 100.0) / 100.0,
                    Math.round(changePct * 100.0) / 100.0,
                    sp.getVolume() != null ? sp.getVolume() : 0L,
                    high,
                    low,
                    bidPrice,
                    askPrice,
                    marketCap,
                    OffsetDateTime.now().toString()
            );

            ticks.add(tick);
            cacheEntries.put(PRICE_KEY_PREFIX + sp.getSymbol(), tick);
        }

        // Batch cache all prices in Redis
        try {
            if (!cacheEntries.isEmpty()) {
                redisTemplate.opsForValue().multiSet(cacheEntries);
                // Set TTL for each key
                for (String key : cacheEntries.keySet()) {
                    redisTemplate.expire(key, Duration.ofSeconds(60));
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to batch cache prices: {}", e.getMessage());
        }

        logger.info("Broadcast {} price updates in single batch query", ticks.size());
        return ticks;
    }

    /**
     * Fetch live market data directly from the DSE API.
     * Falls back to database prices if the API call fails.
     */
    public List<MarketTickDTO> getLivePrices() {
        List<MarketTickDTO> liveTicks = dseMarketClient.fetchLiveMarketData();
        if (!liveTicks.isEmpty()) {
            // Cache live data in Redis
            try {
                Map<String, Object> cacheEntries = new HashMap<>();
                for (MarketTickDTO tick : liveTicks) {
                    cacheEntries.put(PRICE_KEY_PREFIX + tick.symbol(), tick);
                }
                if (!cacheEntries.isEmpty()) {
                    redisTemplate.opsForValue().multiSet(cacheEntries);
                    for (String key : cacheEntries.keySet()) {
                        redisTemplate.expire(key, Duration.ofSeconds(60));
                    }
                }
            } catch (Exception e) {
                logger.warn("Failed to cache live prices: {}", e.getMessage());
            }
            logger.info("Serving {} live prices from DSE API", liveTicks.size());
            return liveTicks;
        }

        // Fallback to database if DSE API is unavailable
        logger.warn("DSE API unavailable, falling back to database prices");
        return getLatestPrices();
    }

    @Cacheable("marketSnapshot")
    public MarketSnapshotDTO getMarketSnapshot() {
        List<MarketTickDTO> ticks = getLatestPrices();

        double indexValue = ticks.stream()
                .mapToDouble(MarketTickDTO::currentPrice)
                .average()
                .orElse(0.0);

        double indexChange = ticks.stream()
                .mapToDouble(MarketTickDTO::changePct)
                .average()
                .orElse(0.0);

        return new MarketSnapshotDTO(
                ticks,
                Math.round(indexValue * 100.0) / 100.0,
                Math.round(indexChange * 100.0) / 100.0,
                OffsetDateTime.now().toString()
        );
    }
}
