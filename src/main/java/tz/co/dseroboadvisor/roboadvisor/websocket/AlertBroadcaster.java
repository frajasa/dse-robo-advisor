package tz.co.dseroboadvisor.roboadvisor.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import tz.co.dseroboadvisor.roboadvisor.dto.market.RebalancingAlertDTO;

import java.util.List;

@Service
public class AlertBroadcaster {

    private static final Logger logger = LoggerFactory.getLogger(AlertBroadcaster.class);

    private final SimpMessagingTemplate messagingTemplate;

    public AlertBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastRebalancingAlerts(String portfolioId, List<RebalancingAlertDTO> alerts) {
        if (alerts.isEmpty()) return;
        messagingTemplate.convertAndSend("/topic/portfolio/" + portfolioId + "/alerts", alerts);
        logger.info("Broadcast {} rebalancing alerts for portfolio {}", alerts.size(), portfolioId);
    }
}
