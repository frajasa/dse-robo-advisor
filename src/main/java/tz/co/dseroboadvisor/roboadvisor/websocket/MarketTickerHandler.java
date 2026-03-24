package tz.co.dseroboadvisor.roboadvisor.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import tz.co.dseroboadvisor.roboadvisor.dto.market.MarketTickDTO;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class MarketTickerHandler {

    private static final Logger logger = LoggerFactory.getLogger(MarketTickerHandler.class);

    private final SimpMessagingTemplate messagingTemplate;

    // Cache the latest broadcast so new subscribers get data immediately
    private volatile List<MarketTickDTO> latestTicks = new CopyOnWriteArrayList<>();

    public MarketTickerHandler(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastLatestPrices(List<MarketTickDTO> ticks) {
        latestTicks = List.copyOf(ticks);
        ticks.forEach(tick ->
                messagingTemplate.convertAndSend("/topic/market/" + tick.symbol(), tick)
        );
        messagingTemplate.convertAndSend("/topic/market/snapshot", ticks);
        logger.debug("Broadcast {} price updates via WebSocket", ticks.size());
    }

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        // When a client subscribes to the snapshot topic, immediately send them the latest data
        String destination = (String) event.getMessage().getHeaders().get("simpDestination");
        if ("/topic/market/snapshot".equals(destination) && !latestTicks.isEmpty()) {
            messagingTemplate.convertAndSend("/topic/market/snapshot", latestTicks);
            logger.info("Sent {} cached prices to new subscriber", latestTicks.size());
        }
    }
}
