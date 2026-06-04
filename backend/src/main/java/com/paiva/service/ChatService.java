package com.paiva.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiva.model.Conversation;
import com.paiva.model.Message;
import com.paiva.repository.ConversationRepository;
import com.paiva.repository.MessageRepository;

import reactor.core.publisher.Flux;

@Service
public class ChatService {


    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final com.paiva.repository.UserRepository userRepository;
    private final WebSearchService webSearchService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Value("${spring.ai.openai.api-key}")
    private String groqApiKey;
    
    @org.springframework.beans.factory.annotation.Value("${spring.ai.openai.base-url}")
    private String groqBaseUrl;

    @org.springframework.beans.factory.annotation.Value("${spring.ai.openai.chat.options.model}")
    private String groqModel;

    public ChatService(ConversationRepository conversationRepository, 
                       MessageRepository messageRepository,
                       com.paiva.repository.UserRepository userRepository,
                       WebSearchService webSearchService) {
                           
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.webSearchService = webSearchService;
    }

    public Conversation createOrGetConversation(String conversationId, String userId, String firstMessage) {
        if (conversationId != null && !conversationId.isEmpty()) {
            return conversationRepository.findById(conversationId).orElseThrow(() -> new RuntimeException("Conversation not found"));
        }
        
        // Generate title from first message (max 30 chars)
        String title = firstMessage.length() > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage;
        Conversation newConv = new Conversation(userId, title);
        return conversationRepository.save(newConv);
    }

    @SuppressWarnings("UseSpecificCatch")
    public Flux<String> streamChat(String conversationId, String userId, String userMessageText) {
        Conversation conversation = createOrGetConversation(conversationId, userId, userMessageText);
        
        // Save user message to MongoDB
        Message userMessage = new Message(conversation.getId(), "USER", userMessageText);
        messageRepository.save(userMessage);

        // Fetch short-term history from MongoDB
        List<Message> history = messageRepository.findByConversationIdOrderByTimestampAsc(conversation.getId());
        
        // Fetch User's Custom Instructions
        String customInstructions = userRepository.findById(userId)
            .map(com.paiva.model.User::getCustomInstructions)
            .orElse("");

        // Construct System Prompt
        String currentDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        String systemPrompt = "You are PAIVA, a highly advanced personalized AI virtual assistant. Be helpful, concise, and friendly.\n" +
            "The current date is " + currentDate + ". Keep this in mind when answering questions about current events.\n" +
            "IMPORTANT VISUAL FEATURE: If the user asks about a famous person, place, event, recipe, or common object, you MUST provide a relevant image.\n" +
            "To do this, output exactly the following markdown syntax on a new line before your text response:\n" +
            "![Alt Text](wiki:Search_Term)\n" +
            "For example, if the user asks 'who is president of america', output:\n" +
            "![Donald Trump](wiki:Donald_Trump)\n" +
            "If they ask for an Omelette recipe, output:\n" +
            "![Omelette](wiki:Omelette)\n" +
            "Always replace spaces with underscores in the Search_Term.";
                              
        if (customInstructions != null && !customInstructions.isBlank()) {
            systemPrompt += "\n\nCRITICAL INSTRUCTIONS FROM USER (You must follow these):\n" + customInstructions;
        }

        // Live Web Search Injection
        boolean needsSearch = userMessageText.matches("(?i).*\\b(who|what|where|when|current|today|2024|2025|2026|latest|news|won|election|president|price)\\b.*");
        if (needsSearch) {
            String searchResults = webSearchService.search(userMessageText);
            if (searchResults != null) {
                systemPrompt += "\n\nLIVE WEB SEARCH RESULTS (Use this real-time data to answer accurately):\n" + searchResults;
            }
        }

        List<Map<String, String>> messagesList = new ArrayList<>();
        messagesList.add(Map.of("role", "system", "content", systemPrompt));
        for (Message msg : history) {
            String role = "USER".equals(msg.getRole()) ? "user" : "assistant";
            messagesList.add(Map.of("role", role, "content", msg.getContent()));
        }

        Map<String, Object> requestBody = Map.of(
            "model", groqModel,
            "stream", true,
            "messages", messagesList
        );

        StringBuilder fullResponse = new StringBuilder();
        String initialChunk = "{}";
        try {
            initialChunk = objectMapper.writeValueAsString(Map.of("conversationId", conversation.getId()));
        } catch (Exception e) {}

        org.springframework.web.reactive.function.client.WebClient webClient = org.springframework.web.reactive.function.client.WebClient.builder()
            .baseUrl(groqBaseUrl)
            .defaultHeader("Authorization", "Bearer " + groqApiKey)
            .defaultHeader("Accept", "text/event-stream")
            .build();

        return reactor.core.publisher.Flux.concat(
            reactor.core.publisher.Flux.just(initialChunk),
            webClient.post()
                .uri("/v1/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> !line.trim().isEmpty())
                .handle((line, sink) -> {
                    try {
                        String jsonStr = line.trim();
                        if (jsonStr.startsWith("data:")) {
                            jsonStr = jsonStr.substring(5).trim();
                        }
                        if (jsonStr.equals("[DONE]")) {
                            return;
                        }
                        com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(jsonStr);
                        com.fasterxml.jackson.databind.JsonNode delta = node.path("choices").path(0).path("delta");
                        if (delta.has("content")) {
                            String content = delta.get("content").asText();
                            fullResponse.append(content);
                            sink.next(objectMapper.writeValueAsString(Map.of("c", content)));
                        }
                    } catch (Exception e) {
                        // Ignore malformed JSON or empty chunks
                    }
                })
        )
        .cast(String.class)
        .onErrorResume(error -> {
            String errorMsg = error.getMessage();
            if (error instanceof org.springframework.web.reactive.function.client.WebClientResponseException e) {
                errorMsg = e.getResponseBodyAsString();
            }
            try {
                return reactor.core.publisher.Flux.just(
                    objectMapper.writeValueAsString(Map.of("c", "[ERROR: " + errorMsg + "]"))
                );
            } catch (Exception ex) {
                return reactor.core.publisher.Flux.empty();
            }
        })
        .doOnComplete(() -> {
            Message assistantMessage = new Message(conversation.getId(), "ASSISTANT", fullResponse.toString());
            messageRepository.save(assistantMessage);
        });
    }

    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public List<Message> getConversationMessages(String conversationId) {
        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
    }

    public void deleteConversation(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        if (!conv.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.delete(conv);
    }

    public Conversation renameConversation(String conversationId, String userId, String newTitle) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new RuntimeException("Conversation not found"));
        if (!conv.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        conv.setTitle(newTitle);
        conv.setUpdatedAt(java.time.LocalDateTime.now());
        return conversationRepository.save(conv);
    }
}
