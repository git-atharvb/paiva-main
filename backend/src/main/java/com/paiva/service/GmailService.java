package com.paiva.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class GmailService {

    private final WebClient webClient;

    public GmailService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://gmail.googleapis.com").build();
    }

    public List<Map<String, Object>> getRecentEmails(String accessToken, int limit) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new RuntimeException("No Google Access Token provided.");
        }

        try {
            // 1. Get a list of recent message IDs
            @SuppressWarnings("unchecked")
            Map<String, Object> listResponse = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/gmail/v1/users/me/messages")
                    .queryParam("maxResults", limit)
                    .build())
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (listResponse == null || !listResponse.containsKey("messages")) {
                return List.of();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, String>> messages = (List<Map<String, String>>) listResponse.get("messages");

            System.out.println("Fetched " + messages.size() + " message IDs from Gmail");

            // 2. Fetch details for each message
            List<Map<String, Object>> detailedMessages = Flux.fromIterable(messages)
                .flatMap(msg -> {
                    String msgId = msg.get("id");
                    return webClient.get()
                        .uri(uriBuilder -> uriBuilder
                            .path("/gmail/v1/users/me/messages/{id}")
                            .queryParam("format", "metadata")
                            .queryParam("metadataHeaders", "Subject", "From", "Date")
                            .build(msgId))
                        .header("Authorization", "Bearer " + accessToken)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .map(detail -> {
                            Map<String, Object> result = new HashMap<>();
                            result.put("id", detail.get("id"));
                            result.put("snippet", detail.get("snippet"));
                            
                            // Extract headers
                            Map<String, Object> payload = (Map<String, Object>) detail.get("payload");
                            if (payload != null && payload.containsKey("headers")) {
                                List<Map<String, String>> headers = (List<Map<String, String>>) payload.get("headers");
                                for (Map<String, String> header : headers) {
                                    String name = header.get("name");
                                    String value = header.get("value");
                                    if ("Subject".equalsIgnoreCase(name)) result.put("subject", value);
                                    if ("From".equalsIgnoreCase(name)) result.put("from", value);
                                    if ("Date".equalsIgnoreCase(name)) result.put("date", value);
                                }
                            }
                            return result;
                        });
                })
                .collectList()
                .block();

            return detailedMessages;

        } catch (Exception e) {
            System.err.println("GMAIL FETCH ERROR: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch emails: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> createDraft(String accessToken, String to, String subject, String body) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new RuntimeException("No Google Access Token provided.");
        }

        try {
            // Create RFC 2822 formatted string
            String emailContent = String.format("To: %s\nSubject: %s\n\n%s", to, subject, body);
            String encodedEmail = Base64.getUrlEncoder().encodeToString(emailContent.getBytes(StandardCharsets.UTF_8));

            Map<String, Object> rawMessage = Map.of("raw", encodedEmail);
            Map<String, Object> requestBody = Map.of("message", rawMessage);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                .uri("/gmail/v1/users/me/drafts")
                .header("Authorization", "Bearer " + accessToken)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create draft: " + e.getMessage(), e);
        }
    }

    public String getFullEmailBody(String accessToken, String messageId) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new RuntimeException("No Google Access Token provided.");
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> detail = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/gmail/v1/users/me/messages/{id}")
                    .queryParam("format", "full")
                    .build(messageId))
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (detail == null || !detail.containsKey("payload")) {
                return "Could not fetch email body.";
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> payload = (Map<String, Object>) detail.get("payload");
            String body = extractPlainText(payload);

            if (body == null || body.isBlank()) {
                body = (String) detail.get("snippet");
            }
            return body != null ? body : "Empty email body.";

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch full email: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractPlainText(Map<String, Object> payload) {
        String mimeType = (String) payload.get("mimeType");
        
        if ("text/plain".equals(mimeType) || "text/html".equals(mimeType)) {
            Map<String, Object> bodyMap = (Map<String, Object>) payload.get("body");
            if (bodyMap != null && bodyMap.containsKey("data")) {
                String data = (String) bodyMap.get("data");
                if (data != null) {
                    byte[] decoded = Base64.getUrlDecoder().decode(data);
                    String decodedStr = new String(decoded, StandardCharsets.UTF_8);
                    // If it's HTML, we might want to strip tags, but for AI plain text is better.
                    if ("text/html".equals(mimeType)) {
                        return decodedStr.replaceAll("<[^>]*>", " ").trim();
                    }
                    return decodedStr;
                }
            }
        }

        if (payload.containsKey("parts")) {
            List<Map<String, Object>> parts = (List<Map<String, Object>>) payload.get("parts");
            // Prefer text/plain over text/html
            String htmlContent = null;
            for (Map<String, Object> part : parts) {
                String partMime = (String) part.get("mimeType");
                if ("text/plain".equals(partMime)) {
                    String extracted = extractPlainText(part);
                    if (extracted != null && !extracted.isBlank()) return extracted;
                } else if ("text/html".equals(partMime)) {
                    htmlContent = extractPlainText(part);
                } else if (partMime != null && partMime.startsWith("multipart/")) {
                    String extracted = extractPlainText(part);
                    if (extracted != null && !extracted.isBlank()) return extracted;
                }
            }
            if (htmlContent != null && !htmlContent.isBlank()) return htmlContent;
        }
        return null;
    }
}
