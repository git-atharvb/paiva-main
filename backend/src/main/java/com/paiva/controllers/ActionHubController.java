package com.paiva.controllers;

import com.paiva.model.User;
import com.paiva.repository.UserRepository;
import com.paiva.security.service.UserDetailsImpl;
import com.paiva.service.ActionHubService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/action-hub")
public class ActionHubController {

    private final ActionHubService actionHubService;
    private final UserRepository userRepository;

    public ActionHubController(ActionHubService actionHubService, UserRepository userRepository) {
        this.actionHubService = actionHubService;
        this.userRepository = userRepository;
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> getSuggestions() {
        String userId = getCurrentUserId();
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        String googleAccessToken = userOpt.get().getGoogleAccessToken();
        
        try {
            List<Map<String, String>> suggestions = actionHubService.generateSuggestions(userId, googleAccessToken);
            return ResponseEntity.ok(Map.of("suggestions", suggestions));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }
}
