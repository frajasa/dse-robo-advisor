package tz.co.dseroboadvisor.roboadvisor.dto.market;

import java.io.Serializable;

public record MarketTickDTO(
        String symbol,
        String name,
        double currentPrice,
        double previousClose,
        double change,
        double changePct,
        long volume,
        double high,
        double low,
        Double bestBidPrice,
        Double bestAskPrice,
        Double marketCap,
        String timestamp
) implements Serializable {}
