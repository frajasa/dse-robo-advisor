package tz.co.dseroboadvisor.roboadvisor.dto.market;

import java.util.List;

public record StockDetailDTO(
        String symbol,
        String companyName,
        String sector,
        Double currentPrice,
        Double previousClose,
        Double change,
        Double changePct,
        Long volume,
        Double high,
        Double low,
        Double bestBidPrice,
        Double bestAskPrice,
        Double marketCap,
        Double dividendYield,
        Double expectedReturn,
        Double volatility,
        Integer dseCompanyId,
        List<OrderBookEntryDTO> orderBook
) {}
