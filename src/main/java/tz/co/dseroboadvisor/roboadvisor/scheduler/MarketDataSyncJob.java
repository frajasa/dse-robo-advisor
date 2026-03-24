package tz.co.dseroboadvisor.roboadvisor.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tz.co.dseroboadvisor.roboadvisor.dto.market.MarketTickDTO;
import tz.co.dseroboadvisor.roboadvisor.service.MarketDataService;
import tz.co.dseroboadvisor.roboadvisor.websocket.MarketTickerHandler;

import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Component
public class MarketDataSyncJob {

    private static final Logger logger = LoggerFactory.getLogger(MarketDataSyncJob.class);

    private final MarketDataService marketDataService;
    private final MarketTickerHandler tickerHandler;
    private long lastOffHoursBroadcast = 0;

    public MarketDataSyncJob(MarketDataService marketDataService, MarketTickerHandler tickerHandler) {
        this.marketDataService = marketDataService;
        this.tickerHandler = tickerHandler;
    }

    @Scheduled(initialDelay = 5000, fixedDelay = 30000)
    public void syncAndBroadcast() {
        try {
            boolean marketOpen = isMarketOpen();

            // During market hours: broadcast every 30s
            // Outside market hours: broadcast last known data every 5 minutes
            if (!marketOpen) {
                long now = System.currentTimeMillis();
                if (now - lastOffHoursBroadcast < 300_000) {
                    return;
                }
                lastOffHoursBroadcast = now;
            }

            List<MarketTickDTO> latestPrices = marketDataService.getLatestPrices();
            if (!latestPrices.isEmpty()) {
                tickerHandler.broadcastLatestPrices(latestPrices);
                logger.info("Broadcast {} price updates (market {})", latestPrices.size(), marketOpen ? "open" : "closed");
            }
        } catch (Exception e) {
            logger.error("Market data sync failed: {}", e.getMessage());
        }
    }

    private boolean isMarketOpen() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Africa/Dar_es_Salaam"));
        DayOfWeek day = now.getDayOfWeek();
        int hour = now.getHour();
        return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY && hour >= 10 && hour < 15;
    }
}
