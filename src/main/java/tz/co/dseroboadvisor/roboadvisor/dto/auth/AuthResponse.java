package tz.co.dseroboadvisor.roboadvisor.dto.auth;

import java.util.UUID;

public record AuthResponse(
        String token,
        String tokenType,
        String refreshToken,
        UUID userId,
        String nickname
) {
    public AuthResponse(String token, String refreshToken, UUID userId, String nickname) {
        this(token, "Bearer", refreshToken, userId, nickname);
    }
}
