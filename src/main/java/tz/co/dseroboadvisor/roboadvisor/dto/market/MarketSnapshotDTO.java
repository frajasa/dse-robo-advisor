package tz.co.dseroboadvisor.roboadvisor.dto.market;

import java.io.Serializable;
import java.util.List;

public record MarketSnapshotDTO(
        List<MarketTickDTO> ticks,
        double indexValue,
        double indexChange,
        String updatedAt
) implements Serializable {}
