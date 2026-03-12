package tz.co.dseroboadvisor.roboadvisor.dto.portfolio;

public record HoldingDTO(
        String symbol,
        String name,
        double allocation,
        double dividendYield,
        String sector,
        String rationale
) {
}
