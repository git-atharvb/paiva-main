package com.paiva.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiva.model.Conversation;
import com.paiva.model.Message;
import com.paiva.repository.ConversationRepository;
import com.paiva.repository.MessageRepository;

@Service
public class MemoryService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.ai.openai.api-key}")
    private String groqApiKey;

    @Value("${spring.ai.openai.base-url}")
    private String groqBaseUrl;

    @Value("${spring.ai.openai.chat.options.model}")
    private String groqModel;

    public MemoryService(MessageRepository messageRepository, ConversationRepository conversationRepository) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
    }

    @Async
    @SuppressWarnings("UseSpecificCatch")
    public void summarizeOldMessages(String conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) return;

        List<Message> fullHistory = messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
        
        // We only summarize if there are more than 10 messages total
        int maxHistoryMessages = 10;
        if (fullHistory.size() <= maxHistoryMessages) {
            return;
        }

        // Find all unsummarized messages that are NOT part of the recent 10 messages
        List<Message> recentMessages = fullHistory.subList(fullHistory.size() - maxHistoryMessages, fullHistory.size());
        List<Message> messagesToSummarize = new ArrayList<>();

        for (Message msg : fullHistory) {
            if (!msg.isSummarized() && !recentMessages.contains(msg)) {
                messagesToSummarize.add(msg);
            }
        }

        if (messagesToSummarize.isEmpty()) {
            return; // Nothing to summarize
        }

        // Construct the prompt for the LLM
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are an expert AI summarizer. Your job is to compress older conversation history into a concise long-term memory summary.\n");
        promptBuilder.append("Do NOT respond to the user's queries. Just provide a summary of the facts, context, and what was discussed.\n\n");
        
        String currentSummary = conversation.getSummary();
        if (currentSummary != null && !currentSummary.isBlank()) {
            promptBuilder.append("CURRENT RUNNING SUMMARY:\n").append(currentSummary).append("\n\n");
            promptBuilder.append("Now, update this summary to include the following new messages. Keep it under 3-4 paragraphs:\n\n");
        } else {
            promptBuilder.append("Please summarize the following conversation. Keep it under 3-4 paragraphs:\n\n");
        }

        for (Message msg : messagesToSummarize) {
            promptBuilder.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
        }

        String systemPrompt = promptBuilder.toString();

        List<Map<String, Object>> requestMessages = List.of(
            Map.of("role", "system", "content", systemPrompt)
        );

        Map<String, Object> requestBody = Map.of(
            "model", groqModel,
            "messages", requestMessages
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
            String newSummary = node.path("choices").path(0).path("message").path("content").asText();

            if (newSummary != null && !newSummary.isBlank()) {
                // Save new summary
                conversation.setSummary(newSummary);
                conversationRepository.save(conversation);

                // Mark messages as summarized
                for (Message msg : messagesToSummarize) {
                    msg.setSummarized(true);
                    messageRepository.save(msg);
                }
                
                System.out.println("✅ MemoryService: Background summarization completed for conversation " + conversationId);
            }
        } catch (Exception e) {
            System.err.println("❌ MemoryService: Summarization failed: " + e.getMessage());
        }
    }
}
