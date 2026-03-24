package tz.co.dseroboadvisor.roboadvisor.dto.market;

public record OrderBookEntryDTO(
        double buyPrice,
        int buyQuantity,
        double sellPrice,
        int sellQuantity
) {}
