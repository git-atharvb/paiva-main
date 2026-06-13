package com.paiva.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiva.model.Message;
import com.paiva.repository.MessageRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ActionHubService {

    private static class CacheEntry {
        List<Map<String, String>> suggestions;
        long timestamp;
        CacheEntry(List<Map<String, String>> suggestions, long timestamp) {
            this.suggestions = suggestions;
            this.timestamp = timestamp;
        }
    }
    
    private final Map<String, CacheEntry> suggestionCache = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MessageRepository messageRepository;
    private final GmailService gmailService;

    @Value("${spring.ai.openai.api-key}")
    private String groqApiKey;

    @Value("${spring.ai.openai.base-url}")
    private String groqBaseUrl;

    @Value("${spring.ai.openai.chat.options.model}")
    private String groqModel;

    public ActionHubService(MessageRepository messageRepository, GmailService gmailService) {
        this.messageRepository = messageRepository;
        this.gmailService = gmailService;
    }

    @SuppressWarnings("UseSpecificCatch")
    public List<Map<String, String>> generateSuggestions(String userId, String googleAccessToken) {
        CacheEntry entry = suggestionCache.get(userId);
        if (entry != null && System.currentTimeMillis() - entry.timestamp < 300000) { // 5 minutes
            return entry.suggestions;
        }

        StringBuilder contextBuilder = new StringBuilder();
        
        // 1. Fetch recent chat messages from all user's conversations
        // (For simplicity we just get the latest 10 messages across all conversations)
        List<Message> recentChats = messageRepository.findTop10ByOrderByTimestampDesc(); 
        // Note: For a real production app we'd filter by userId, but currently messages might not have userId directly if they are tied to conversations.
        
        contextBuilder.append("RECENT CHAT MESSAGES:\n");
        for (Message msg : recentChats) {
            contextBuilder.append("- ").append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
        }

        // 2. Fetch recent emails if Google is connected
        if (googleAccessToken != null && !googleAccessToken.isBlank()) {
            contextBuilder.append("\nRECENT EMAILS:\n");
            try {
                List<Map<String, Object>> emails = gmailService.getRecentEmails(googleAccessToken, 5);
                for (Map<String, Object> email : emails) {
                    contextBuilder.append("- From: ").append(email.get("from")).append(" | Subject: ").append(email.get("subject")).append("\n");
                    contextBuilder.append("  Snippet: ").append(email.get("snippet")).append("\n");
                }
            } catch (Exception e) {
                System.err.println("Could not fetch emails for Action Hub: " + e.getMessage());
            }
        }

        // 3. Ask Groq to extract tasks
        String prompt = "You are an AI assistant analyzing recent chats and emails to find actionable items.\n" +
            "Look for explicit requests, implied tasks, or meetings.\n" +
            "Extract up to 3 actionable items. Output them strictly as a JSON array of objects, with keys: 'type' (either 'todo' or 'event'), 'title' (a short summary of the task), and 'source' (either 'Chat' or 'Email').\n" +
            "Do NOT wrap the JSON in markdown code blocks. Just output the raw JSON array.\n" +
            "If no tasks are found, output an empty array [].\n\n" +
            contextBuilder.toString();

        List<Map<String, Object>> requestMessages = List.of(
            Map.of("role", "user", "content", prompt)
        );

        Map<String, Object> requestBody = Map.of(
            "model", groqModel,
            "messages", requestMessages,
            "temperature", 0.3
        );

        WebClient webClient = WebClient.builder()
            .baseUrl(groqBaseUrl)
            .defaultHeader("Authorization", "Bearer " + groqApiKey)
            .build();

        try {
            String responseJson = webClient.post()
                .uri("/v1/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode node = objectMapper.readTree(responseJson);
            String content = node.path("choices").path(0).path("message").path("content").asText();
            
            // Clean up possible markdown wrappers
            if (content.startsWith("```json")) {
                content = content.replace("```json", "").replace("```", "").trim();
            } else if (content.startsWith("```")) {
                content = content.replace("```", "").trim();
            }

            JsonNode jsonArray = objectMapper.readTree(content);
            List<Map<String, String>> suggestions = new ArrayList<>();
            if (jsonArray.isArray()) {
                for (JsonNode item : jsonArray) {
                    Map<String, String> suggestion = new HashMap<>();
                    suggestion.put("id", java.util.UUID.randomUUID().toString());
                    suggestion.put("type", item.path("type").asText("todo"));
                    suggestion.put("title", item.path("title").asText());
                    suggestion.put("source", item.path("source").asText());
                    suggestions.add(suggestion);
                }
            }
            
            if (!suggestions.isEmpty()) {
                suggestionCache.put(userId, new CacheEntry(suggestions, System.currentTimeMillis()));
            }
            
            return suggestions;

        } catch (Exception e) {
            System.err.println("❌ ActionHubService: Failed to generate suggestions: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
