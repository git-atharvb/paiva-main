package com.paiva.controllers;

import com.paiva.model.User;
import com.paiva.repository.UserRepository;
import com.paiva.security.service.UserDetailsImpl;
import com.paiva.service.GmailService;
import com.paiva.service.AiEmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/gmail")
public class GmailController {

    private final GmailService gmailService;
    private final AiEmailService aiEmailService;
    private final UserRepository userRepository;

    public GmailController(GmailService gmailService, AiEmailService aiEmailService, UserRepository userRepository) {
        this.gmailService = gmailService;
        this.aiEmailService = aiEmailService;
        this.userRepository = userRepository;
    }

    @GetMapping("/emails")
    public ResponseEntity<?> getRecentEmails(@RequestParam(defaultValue = "10") int limit) {
        String userId = getCurrentUserId();
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        String accessToken = userOpt.get().getGoogleAccessToken();
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(401).body("Google Calendar/Gmail not connected");
        }

        try {
            List<Map<String, Object>> emails = gmailService.getRecentEmails(accessToken, limit);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/draft")
    public ResponseEntity<?> createDraft(@RequestBody Map<String, String> payload) {
        String userId = getCurrentUserId();
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        String accessToken = userOpt.get().getGoogleAccessToken();
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(401).body("Google Calendar/Gmail not connected");
        }

        String to = payload.get("to");
        String subject = payload.get("subject");
        String body = payload.get("body");

        if (to == null || subject == null || body == null) {
            return ResponseEntity.badRequest().body("Missing required fields: to, subject, body");
        }

        try {
            Map<String, Object> draft = gmailService.createDraft(accessToken, to, subject, body);
            return ResponseEntity.ok(draft);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/summarize")
    public ResponseEntity<?> summarizeInbox(@RequestBody List<Map<String, String>> emailsToSummarize) {
        String userId = getCurrentUserId();
        if (userRepository.findById(userId).isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        if (emailsToSummarize == null || emailsToSummarize.isEmpty()) {
            return ResponseEntity.badRequest().body("No emails provided for summarization");
        }

        try {
            String summary = aiEmailService.summarizeEmails(emailsToSummarize);
            return ResponseEntity.ok(Map.of("summary", summary));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/smart-reply")
    public ResponseEntity<?> generateSmartReply(@RequestBody Map<String, String> payload) {
        String userId = getCurrentUserId();
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }

        String accessToken = userOpt.get().getGoogleAccessToken();
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(401).body("Google Calendar/Gmail not connected");
        }

        String messageId = payload.get("messageId");
        String sender = payload.get("sender");
        String subject = payload.get("subject");

        if (messageId == null) {
            return ResponseEntity.badRequest().body("Missing required field: messageId");
        }

        try {
            // 1. Fetch full email body
            String emailBody = gmailService.getFullEmailBody(accessToken, messageId);

            // 2. Generate smart reply
            String draftText = aiEmailService.generateSmartReply(emailBody, sender, subject);

            return ResponseEntity.ok(Map.of("replyText", draftText));
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
