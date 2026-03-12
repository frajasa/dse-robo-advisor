package tz.co.dseroboadvisor.roboadvisor.dto.auth;

import java.util.UUID;

public record AuthResponse(
        String token,
        String tokenType,
        UUID userId,
        String email,
        String fullName
) {
    public AuthResponse(String token, UUID userId, String email, String fullName) {
        this(token, "Bearer", userId, email, fullName);
    }
}
