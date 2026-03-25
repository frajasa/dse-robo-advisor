package tz.co.dseroboadvisor.roboadvisor.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import tz.co.dseroboadvisor.roboadvisor.dto.market.MarketTickDTO;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Client that fetches live market data directly from the official DSE API.
 * Used during market hours to provide real-time volume and price updates.
 */
@Component
public class DseMarketClient {

    private static final Logger logger = LoggerFactory.getLogger(DseMarketClient.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    private final WebClient webClient;

    public DseMarketClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://api.dse.co.tz")
                .build();
    }

    /**
     * Fetch live market data from the official DSE API and convert to MarketTickDTOs.
     * Returns an empty list if the API is unreachable or returns invalid data.
     */
    public List<MarketTickDTO> fetchLiveMarketData() {
        try {
            List<Map<String, Object>> entries = webClient.get()
                    .uri("/api/market-data?isBond=false")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                    .timeout(TIMEOUT)
                    .block();

            if (entries == null || entries.isEmpty()) {
                logger.warn("DSE API returned empty response");
                return Collections.emptyList();
            }

            List<MarketTickDTO> ticks = new ArrayList<>();
            String timestamp = OffsetDateTime.now().toString();

            for (Map<String, Object> entry : entries) {
                try {
                    MarketTickDTO tick = parseEntry(entry, timestamp);
                    if (tick != null) {
                        ticks.add(tick);
                    }
                } catch (Exception e) {
                    logger.debug("Skipping malformed DSE entry: {}", e.getMessage());
                }
            }

            logger.info("Fetched {} live market ticks from DSE API", ticks.size());
            return ticks;

        } catch (Exception e) {
            logger.error("Failed to fetch live data from DSE API: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private MarketTickDTO parseEntry(Map<String, Object> entry, String timestamp) {
        Map<String, Object> company = getMap(entry, "company");

        String symbol = getString(company, "symbol");
        if (symbol == null || symbol.isBlank()) {
            return null;
        }
        symbol = symbol.trim().toUpperCase();

        double currentPrice = toDouble(entry.get("marketPrice"));
        if (currentPrice <= 0) {
            return null;
        }

        double high = toDouble(entry.get("high"));
        if (high <= 0) high = currentPrice;

        double low = toDouble(entry.get("low"));
        if (low <= 0) low = currentPrice;

        long volume = toLong(entry.get("volume"));

        // Use the API's change field to derive previous close
        double change = toDouble(entry.get("change"));
        double previousClose = currentPrice - change;
        if (previousClose <= 0) previousClose = currentPrice;

        double changePct = previousClose > 0 ? (change / previousClose) * 100 : 0.0;

        Double bidPrice = toDoubleOrNull(entry.get("bestBidPrice"));
        Double askPrice = toDoubleOrNull(entry.get("bestOfferPrice"));
        Double marketCap = toDoubleOrNull(entry.get("marketCap"));

        String name = getString(company, "name");
        if (name == null) name = symbol;

        return new MarketTickDTO(
                symbol,
                name,
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
                timestamp
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getMap(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Map) {
            return (Map<String, Object>) val;
        }
        return Collections.emptyMap();
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        try {
            return Double.parseDouble(val.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private Double toDoubleOrNull(Object val) {
        if (val == null) return null;
        try {
            double d = Double.parseDouble(val.toString());
            return d != 0.0 ? d : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private long toLong(Object val) {
        if (val == null) return 0L;
        try {
            return Long.parseLong(val.toString().split("\\.")[0]);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
