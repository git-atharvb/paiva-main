package com.paiva.controllers;

import com.paiva.model.User;
import com.paiva.payload.request.UpdateSettingsRequest;
import com.paiva.repository.UserRepository;
import com.paiva.security.service.UserDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getUserSettings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Map<String, String> response = new HashMap<>();
            response.put("customInstructions", nullToEmpty(user.getCustomInstructions()));
            response.put("assistantName", nullToEmpty(user.getAssistantName()));
            response.put("aboutUser", nullToEmpty(user.getAboutUser()));
            response.put("responseStyle", nullToEmpty(user.getResponseStyle()));
            response.put("memoryEnabled", String.valueOf(user.isMemoryEnabled()));
            response.put("calendarConnected", String.valueOf(user.getGoogleAccessToken() != null && !user.getGoogleAccessToken().isBlank()));
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body("Error: User not found.");
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateUserSettings(@RequestBody UpdateSettingsRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setCustomInstructions(trimToLimit(request.getCustomInstructions(), 4000));
            user.setAssistantName(normalizeAssistantName(request.getAssistantName()));
            user.setAboutUser(trimToLimit(request.getAboutUser(), 3000));
            user.setResponseStyle(normalizeResponseStyle(request.getResponseStyle()));
            if (request.getMemoryEnabled() != null) {
                user.setMemoryEnabled(request.getMemoryEnabled());
            }
            if (request.getGoogleAccessToken() != null) {
                user.setGoogleAccessToken(request.getGoogleAccessToken());
            }
            if (request.getGoogleRefreshToken() != null) {
                user.setGoogleRefreshToken(request.getGoogleRefreshToken());
            }
            userRepository.save(user);
            return ResponseEntity.ok("User settings updated successfully!");
        }
        return ResponseEntity.badRequest().body("Error: User not found.");
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String trimToLimit(String value, int limit) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() > limit ? trimmed.substring(0, limit) : trimmed;
    }

    private String normalizeAssistantName(String value) {
        String cleaned = trimToLimit(value, 40);
        return cleaned.isBlank() ? "PAIVA" : cleaned;
    }

    private String normalizeResponseStyle(String value) {
        String cleaned = trimToLimit(value, 40);
        return cleaned.isBlank() ? "Balanced" : cleaned;
    }
}
