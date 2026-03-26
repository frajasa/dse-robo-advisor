package tz.co.dseroboadvisor.roboadvisor.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Nickname is required")
        @Size(min = 3, max = 50, message = "Nickname must be 3-50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Nickname can only contain letters, numbers, and underscores")
        String nickname,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password
) {
}
