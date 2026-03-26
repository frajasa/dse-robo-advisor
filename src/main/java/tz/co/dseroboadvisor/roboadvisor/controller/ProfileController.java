package tz.co.dseroboadvisor.roboadvisor.controller;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import tz.co.dseroboadvisor.roboadvisor.entity.InvestorProfile;
import tz.co.dseroboadvisor.roboadvisor.entity.User;
import tz.co.dseroboadvisor.roboadvisor.exception.ResourceNotFoundException;
import tz.co.dseroboadvisor.roboadvisor.repository.UserRepository;
import tz.co.dseroboadvisor.roboadvisor.service.ProfileService;

import java.util.Map;

@Controller
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    public ProfileController(ProfileService profileService, UserRepository userRepository) {
        this.profileService = profileService;
        this.userRepository = userRepository;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public InvestorProfile myProfile() {
        User user = getCurrentUser();
        return profileService.getProfile(user.getId()).orElse(null);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public InvestorProfile createProfile(@Argument Map<String, Object> input) {
        User user = getCurrentUser();
        return profileService.createProfile(user.getId(), input);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public InvestorProfile updateProfile(@Argument Map<String, Object> input) {
        User user = getCurrentUser();
        return profileService.updateProfile(user.getId(), input);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String nickname = authentication.getName();
        return userRepository.findByNickname(nickname)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
    }
}
