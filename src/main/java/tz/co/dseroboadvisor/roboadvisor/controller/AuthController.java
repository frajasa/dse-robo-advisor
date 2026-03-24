package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.dto.auth.AuthResponse;
import tz.co.dseroboadvisor.roboadvisor.dto.auth.LoginRequest;
import tz.co.dseroboadvisor.roboadvisor.dto.auth.RegisterRequest;
import tz.co.dseroboadvisor.roboadvisor.service.AuthService;

import java.util.Map;

@Controller
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @MutationMapping
    public AuthResponse register(@Argument Map<String, Object> input) {
        RegisterRequest request = new RegisterRequest(
                (String) input.get("email"),
                (String) input.get("password"),
                (String) input.get("fullName"),
                (String) input.get("phone")
        );

        return authService.register(request);
    }

    @MutationMapping
    public AuthResponse login(@Argument Map<String, Object> input) {
        LoginRequest request = new LoginRequest(
                (String) input.get("email"),
                (String) input.get("password")
        );

        return authService.login(request);
    }

    @MutationMapping
    public AuthResponse refreshToken(@Argument String refreshToken) {
        return authService.refreshToken(refreshToken);
    }
}
