package tz.co.dseroboadvisor.roboadvisor.dto.portfolio;

import com.fasterxml.jackson.annotation.JsonProperty;

public record HoldingDTO(
        String symbol,
        String name,
        double allocation,
        @JsonProperty("dividend_yield") double dividendYield,
        String sector,
        String rationale
) {
}
