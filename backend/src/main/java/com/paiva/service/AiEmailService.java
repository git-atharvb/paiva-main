package com.paiva.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class AiEmailService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.ai.openai.api-key}")
    private String groqApiKey;

    @Value("${spring.ai.openai.base-url}")
    private String groqBaseUrl;

    @Value("${spring.ai.openai.chat.options.model}")
    private String groqModel;

    @SuppressWarnings("UseSpecificCatch")
    public String summarizeEmails(List<Map<String, String>> emailsToSummarize) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are an expert AI assistant organizing the user's inbox.\n");
        promptBuilder.append("Please provide a concise, readable digest of these recent emails. Highlight anything that looks urgent or requires action.\n\n");

        for (Map<String, String> email : emailsToSummarize) {
            promptBuilder.append("- From: ").append(email.getOrDefault("from", "Unknown")).append("\n");
            promptBuilder.append("  Subject: ").append(email.getOrDefault("subject", "No Subject")).append("\n");
            promptBuilder.append("  Snippet: ").append(email.getOrDefault("snippet", "")).append("\n\n");
        }

        return generateText(promptBuilder.toString());
    }

    @SuppressWarnings("UseSpecificCatch")
    public String generateSmartReply(String emailBody, String sender, String subject) {
        String prompt = "You are an expert AI assistant writing an email reply for the user.\n" +
            "The user received an email from " + sender + " with the subject '" + subject + "'.\n" +
            "Here is the email body:\n" +
            "-----------------\n" +
            emailBody + "\n" +
            "-----------------\n" +
            "Please draft a polite, concise, and professional reply. Do not include subject or to fields, JUST the body of the reply.";

        return generateText(prompt);
    }

    private String generateText(String prompt) {
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
            System.err.println("❌ AiEmailService: Generation failed: " + e.getMessage());
            return "Error generating response: " + e.getMessage();
        }
    }
}
