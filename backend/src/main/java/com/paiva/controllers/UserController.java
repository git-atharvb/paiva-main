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

import com.paiva.repository.*;
import java.util.List;
import com.paiva.model.Conversation;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NoteRepository noteRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public UserController(UserRepository userRepository, 
                          ConversationRepository conversationRepository,
                          MessageRepository messageRepository,
                          NoteRepository noteRepository,
                          RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.noteRepository = noteRepository;
        this.refreshTokenRepository = refreshTokenRepository;
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
            response.put("provider", user.getProvider().name());
            
            response.put("aiModel", nullToEmpty(user.getAiModel()));
            response.put("aiCreativity", String.valueOf(user.getAiCreativity()));
            response.put("autoPlayVoice", String.valueOf(user.isAutoPlayVoice()));
            response.put("uiSoundsEnabled", String.valueOf(user.isUiSoundsEnabled()));
            
            response.put("currentFocus", nullToEmpty(user.getCurrentFocus()));
            response.put("expertiseLevel", nullToEmpty(user.getExpertiseLevel()));
            response.put("uiDensity", nullToEmpty(user.getUiDensity()));
            response.put("preferredLanguage", nullToEmpty(user.getPreferredLanguage()));
            response.put("userDisplayName", nullToEmpty(user.getUserDisplayName()));
            
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
            if (request.getAiModel() != null) {
                user.setAiModel(request.getAiModel());
            }
            if (request.getAiCreativity() != null) {
                user.setAiCreativity(request.getAiCreativity());
            }
            if (request.getAutoPlayVoice() != null) {
                user.setAutoPlayVoice(request.getAutoPlayVoice());
            }
            if (request.getUiSoundsEnabled() != null) {
                user.setUiSoundsEnabled(request.getUiSoundsEnabled());
            }
            if (request.getCurrentFocus() != null) {
                user.setCurrentFocus(request.getCurrentFocus());
            }
            if (request.getExpertiseLevel() != null) {
                user.setExpertiseLevel(request.getExpertiseLevel());
            }
            if (request.getUiDensity() != null) {
                user.setUiDensity(request.getUiDensity());
            }
            if (request.getPreferredLanguage() != null) {
                user.setPreferredLanguage(request.getPreferredLanguage());
            }
            if (request.getUserDisplayName() != null) {
                user.setUserDisplayName(request.getUserDisplayName());
            }
            
            userRepository.save(user);
            return ResponseEntity.ok("User settings updated successfully!");
        }
        return ResponseEntity.badRequest().body("Error: User not found.");
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Delete tokens
            refreshTokenRepository.deleteByUser(user);
            
            // Delete notes
            noteRepository.deleteByUserId(user.getId());
            
            // Delete messages for all conversations of this user
            List<Conversation> conversations = conversationRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());
            for (Conversation conv : conversations) {
                messageRepository.deleteByConversationId(conv.getId());
            }
            
            // Delete conversations
            conversationRepository.deleteByUserId(user.getId());
            
            // Delete user account
            userRepository.delete(user);
            
            return ResponseEntity.ok("Account deleted successfully!");
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
