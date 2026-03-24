package tz.co.dseroboadvisor.roboadvisor.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.dseroboadvisor.roboadvisor.entity.Notification;
import tz.co.dseroboadvisor.roboadvisor.entity.PriceAlert;
import tz.co.dseroboadvisor.roboadvisor.entity.Stock;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.NotificationRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.PriceAlertRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.StockRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AlertService {

    private final PriceAlertRepository priceAlertRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;

    public AlertService(PriceAlertRepository priceAlertRepository,
                        NotificationRepository notificationRepository,
                        UserRepository userRepository,
                        StockRepository stockRepository) {
        this.priceAlertRepository = priceAlertRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
    }

    public List<PriceAlert> getUserAlerts(UUID userId) {
        return priceAlertRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public PriceAlert createPriceAlert(UUID userId, String symbol, double targetPrice, String direction) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        String companyName = symbol;
        try {
            Stock stock = stockRepository.findBySymbol(symbol).orElse(null);
            if (stock != null) companyName = stock.getCompanyName();
        } catch (Exception ignored) {}

        PriceAlert alert = PriceAlert.builder()
                .user(user)
                .symbol(symbol.toUpperCase())
                .companyName(companyName)
                .targetPrice(BigDecimal.valueOf(targetPrice))
                .direction(direction.toUpperCase())
                .build();

        return priceAlertRepository.save(alert);
    }

    public boolean deletePriceAlert(UUID alertId, UUID userId) {
        PriceAlert alert = priceAlertRepository.findById(alertId).orElse(null);
        if (alert == null || !alert.getUser().getId().equals(userId)) return false;
        priceAlertRepository.delete(alert);
        return true;
    }

    public List<Notification> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public boolean markNotificationRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification == null || !notification.getUser().getId().equals(userId)) return false;
        notification.setRead(true);
        notificationRepository.save(notification);
        return true;
    }

    @Transactional
    public boolean markAllNotificationsRead(UUID userId) {
        notificationRepository.markAllReadForUser(userId);
        return true;
    }

    public void createNotification(UUID userId, String type, String title, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .build();

        notificationRepository.save(notification);
    }
}
