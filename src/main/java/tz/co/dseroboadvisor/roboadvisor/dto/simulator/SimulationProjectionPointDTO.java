package tz.co.dseroboadvisor.roboadvisor.dto.simulator;

public record SimulationProjectionPointDTO(
        int year,
        double optimistic,
        double expected,
        double pessimistic
) {}
