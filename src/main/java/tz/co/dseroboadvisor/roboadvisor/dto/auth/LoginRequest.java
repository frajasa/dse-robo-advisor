package tz.co.dseroboadvisor.roboadvisor.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Nickname is required")
        String nickname,

        @NotBlank(message = "Password is required")
        String password
) {
}
