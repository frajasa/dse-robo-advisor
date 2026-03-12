package tz.co.dseroboadvisor.roboadvisor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.co.dseroboadvisor.roboadvisor.dto.auth.AuthResponse;
import tz.co.dseroboadvisor.roboadvisor.dto.auth.LoginRequest;
import tz.co.dseroboadvisor.roboadvisor.dto.auth.RegisterRequest;
import tz.co.dseroboadvisor.roboadvisor.entity.Subscription;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.SubscriptionTier;
import tz.co.dseroboadvisor.roboadvisor.entity.enums.UserRole;
import tz.co.dseroboadvisor.roboadvisor.exception.DuplicateResourceException;
import tz.co.dseroboadvisor.roboadvisor.exception.InvalidInputException;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.SubscriptionRepository;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;
import tz.co.dseroboadvisor.roboadvisor.security.JwtTokenProvider;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       SubscriptionRepository subscriptionRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        if (request.password() == null || request.password().length() < 8) {
            throw new InvalidInputException("Password must be at least 8 characters");
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .role(UserRole.USER)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        Subscription subscription = Subscription.builder()
                .user(user)
                .tier(SubscriptionTier.FREE)
                .isActive(true)
                .build();

        subscriptionRepository.save(subscription);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        String token = jwtTokenProvider.generateToken(authentication);

        logger.info("New user registered: {}", user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );

            String token = jwtTokenProvider.generateToken(authentication);

            User user = userRepository.findByEmail(request.email())
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.email()));

            logger.info("User logged in: {}", user.getId());
            return new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName());
        } catch (BadCredentialsException e) {
            logger.warn("Failed login attempt for email: {}", request.email());
            throw new InvalidInputException("Invalid email or password");
        }
    }
}
