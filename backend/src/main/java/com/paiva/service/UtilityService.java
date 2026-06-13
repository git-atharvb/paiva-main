package com.paiva.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class UtilityService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.ai.openai.api-key}")
    private String groqApiKey;

    @Value("${spring.ai.openai.base-url}")
    private String groqBaseUrl;

    @Value("${spring.ai.openai.chat.options.model}")
    private String groqModel;

    public String generateText(String prompt) {
        List<Map<String, Object>> requestMessages = List.of(
            Map.of("role", "user", "content", prompt)
        );

        Map<String, Object> requestBody = Map.of(
            "model", groqModel,
            "messages", requestMessages,
            "temperature", 0.7
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
            return content != null ? content.trim() : "Failed to generate text.";
        } catch (Exception e) {
            System.err.println("❌ UtilityService: Generation failed: " + e.getMessage());
            return "Error generating response: " + e.getMessage();
        }
    }

    public String generateJson(String prompt) {
        List<Map<String, Object>> requestMessages = List.of(
            Map.of("role", "user", "content", prompt)
        );

        Map<String, Object> requestBody = Map.of(
            "model", groqModel,
            "messages", requestMessages,
            "temperature", 0.7,
            "response_format", Map.of("type", "json_object")
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
            return content != null ? content.trim() : "{}";
        } catch (Exception e) {
            System.err.println("❌ UtilityService: JSON Generation failed: " + e.getMessage());
            return "{\"error\": \"Error generating JSON response\"}";
        }
    }
}
