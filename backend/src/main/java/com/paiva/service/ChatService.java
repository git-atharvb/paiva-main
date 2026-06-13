package com.paiva.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paiva.model.Conversation;
import com.paiva.model.Message;
import com.paiva.model.Note;
import com.paiva.model.User;
import com.paiva.repository.ConversationRepository;
import com.paiva.repository.MessageRepository;
import com.paiva.repository.NoteRepository;

import reactor.core.publisher.Flux;

@Service
public class ChatService {


    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final com.paiva.repository.UserRepository userRepository;
    private final WebSearchService webSearchService;
    private final YouTubeTranscriptService youTubeTranscriptService;
    private final MemoryService memoryService;
    private final NoteRepository noteRepository;
    private final GoogleCalendarService googleCalendarService;
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
                       WebSearchService webSearchService,
                       YouTubeTranscriptService youTubeTranscriptService,
                       MemoryService memoryService,
                       NoteRepository noteRepository,
                       GoogleCalendarService googleCalendarService) {
                           
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.webSearchService = webSearchService;
        this.youTubeTranscriptService = youTubeTranscriptService;
        this.memoryService = memoryService;
        this.noteRepository = noteRepository;
        this.googleCalendarService = googleCalendarService;
    }

    public Conversation createOrGetConversation(String conversationId, String userId, String firstMessage) {
        if (conversationId != null && !conversationId.isEmpty()) {
            Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
            if (!conversation.getUserId().equals(userId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation does not belong to the current user");
            }
            return conversation;
        }
        
        // Generate title from first message (max 30 chars)
        String title = firstMessage.length() > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage;
        Conversation newConv = new Conversation(userId, title);
        return conversationRepository.save(newConv);
    }

    @SuppressWarnings("UseSpecificCatch")
    public Flux<String> streamChat(String conversationId, String userId, String userMessageText, boolean contextImageEnabled, String aiModel, String attachedDocumentText, String attachedImageBase64, String userLocation) {
        Conversation conversation = createOrGetConversation(conversationId, userId, userMessageText);
        
        // Save user message to MongoDB
        Message userMessage = new Message(conversation.getId(), "USER", userMessageText);
        messageRepository.save(userMessage);

        // Fetch short-term history from MongoDB
        List<Message> fullHistory = messageRepository.findByConversationIdOrderByTimestampAsc(conversation.getId());
        
        // Implement Rolling Memory: only keep the last 10 messages to prevent token limit exhaustion
        int maxHistoryMessages = 10;
        List<Message> history = fullHistory.size() > maxHistoryMessages 
            ? fullHistory.subList(fullHistory.size() - maxHistoryMessages, fullHistory.size()) 
            : fullHistory;
        
        User user = userRepository.findById(userId).orElse(null);
        String assistantName = user != null && user.getAssistantName() != null && !user.getAssistantName().isBlank()
            ? user.getAssistantName()
            : "PAIVA";
        String customInstructions = user != null ? user.getCustomInstructions() : "";
        String aboutUser = user != null ? user.getAboutUser() : "";
        String responseStyle = user != null && user.getResponseStyle() != null && !user.getResponseStyle().isBlank()
            ? user.getResponseStyle()
            : "Balanced";
            
        String currentFocus = user != null ? user.getCurrentFocus() : "";
        String expertiseLevel = user != null && user.getExpertiseLevel() != null && !user.getExpertiseLevel().isBlank()
            ? user.getExpertiseLevel() : "Intermediate";
        String preferredLanguage = user != null && user.getPreferredLanguage() != null && !user.getPreferredLanguage().isBlank()
            ? user.getPreferredLanguage() : "English";
        String userDisplayName = user != null && user.getUserDisplayName() != null && !user.getUserDisplayName().isBlank()
            ? user.getUserDisplayName() : "the user";

        boolean memoryEnabled = user == null || user.isMemoryEnabled();

        // Construct System Prompt
        String currentDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        String systemPrompt = "You are " + assistantName + ", a highly advanced personalized AI virtual assistant for " + userDisplayName + ".\n"
            + "Your product identity is PAIVA: Personalized AI Virtual Assistant.\n"
            + "Be helpful, concise, emotionally intelligent, and practical.\n"
            + "The current date is " + currentDate + ". Keep this in mind when answering questions about current events.\n"
            + "You MUST communicate with the user in " + preferredLanguage + ", unless they explicitly ask otherwise.\n";

        systemPrompt += "\nPERSONALIZATION PROFILE:\n";
        systemPrompt += "- Preferred assistant name: " + assistantName + "\n";
        systemPrompt += "- User's name: " + userDisplayName + "\n";
        systemPrompt += "- User's expertise level: " + expertiseLevel + " (Adjust the technical depth and complexity of your answers accordingly)\n";
        if (currentFocus != null && !currentFocus.isBlank()) {
            systemPrompt += "- User's current focus / goal: " + currentFocus + " (Align your answers to this context when relevant)\n";
        }
        systemPrompt += "- Response style: " + responseStyle + "\n";
        if (aboutUser != null && !aboutUser.isBlank()) {
            systemPrompt += "- What PAIVA knows about the user:\n" + aboutUser + "\n";
        }
            
        if (contextImageEnabled) {
            systemPrompt += """
                            IMPORTANT VISUAL FEATURE: You MUST provide exactly 3 to 4 relevant images for different key concepts mentioned in your response.
                            To do this, output exactly the following markdown syntax on new lines before your text response:
                            ![Alt Text](wiki:Search_Term)
                            For example, if the user asks 'who is president of america', output 3 different images:
                            ![Donald Trump](wiki:Donald_Trump)
                            ![White House](wiki:White_House)
                            ![Washington DC](wiki:Washington_DC)
                            Always replace spaces with underscores in the Search_Term. Do NOT output multiple images for the same concept.
                            """;
        } else {
            systemPrompt += "CRITICAL INSTRUCTION: The user has DISABLED images for this request. Do NOT output any markdown images or wiki: links under any circumstances, even if you did so previously. ONLY output plain text.\n";
        }
                              
        if (customInstructions != null && !customInstructions.isBlank()) {
            systemPrompt += "\n\nCRITICAL INSTRUCTIONS FROM USER (You must follow these):\n" + customInstructions;
        }

        // Long-Term Memory Injection
        String longTermSummary = conversation.getSummary();
        if (memoryEnabled && longTermSummary != null && !longTermSummary.isBlank()) {
            systemPrompt += "\n\nLONG-TERM MEMORY (Summary of older messages in this chat):\n" + longTermSummary + "\n";
        }

        // Smart Notes Knowledge Base Injection
        List<Note> userNotes = noteRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        if (userNotes != null && !userNotes.isEmpty()) {
            systemPrompt += "\n\nSMART NOTES (User's Personal Knowledge Base):\n";
            for (Note note : userNotes) {
                systemPrompt += "- **" + note.getTitle() + "**\n" + note.getContent() + "\n\n";
            }
        }

        // URL Scraping Injection
        java.util.regex.Matcher urlMatcher = java.util.regex.Pattern.compile("https?://[^\\s]+").matcher(userMessageText);
        while (urlMatcher.find()) {
            String url = urlMatcher.group();
            
            if (youTubeTranscriptService.isYouTubeUrl(url)) {
                String transcript = youTubeTranscriptService.fetchTranscript(url);
                if (transcript != null && !transcript.isEmpty()) {
                    if (transcript.length() > 30000) {
                        transcript = transcript.substring(0, 30000) + "...[TRUNCATED]";
                    }
                    systemPrompt += "\n\nCRITICAL YOUTUBE TRANSCRIPT:\nThe user referenced this YouTube video: " + url + "\nHere is the exact spoken transcript of the video. Use it to summarize or answer questions:\n" + transcript + "\n";
                } else {
                    systemPrompt += "\n\nCRITICAL YOUTUBE TRANSCRIPT:\nThe user referenced this YouTube video: " + url + "\nHowever, no transcript or closed captions could be found for this video.\n";
                }
                continue;
            }
            
            try {
                String scrapedText = org.jsoup.Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .timeout(5000)
                    .get()
                    .body()
                    .text();
                if (scrapedText.length() > 15000) {
                    scrapedText = scrapedText.substring(0, 15000) + "...[TRUNCATED]";
                }
                systemPrompt += "\n\nCRITICAL URL CONTEXT:\nThe user referenced this URL: " + url + "\nHere is the scraped text from that page to help you answer:\n" + scrapedText + "\n";
            } catch (Exception e) {
                systemPrompt += "\n\nCRITICAL URL CONTEXT:\nThe user referenced this URL: " + url + "\nHowever, the webpage could not be scraped due to an error or anti-bot protection.\n";
            }
        }

        // PDF / Document Text Injection
        if (attachedDocumentText != null && !attachedDocumentText.isBlank()) {
            systemPrompt += "\n\nCRITICAL DOCUMENT CONTEXT:\nThe user has attached a document for you to analyze. Here is the extracted text:\n" + attachedDocumentText + "\n";
        }

        // Inject Location Context
        if (userLocation != null && !userLocation.isBlank()) {
            systemPrompt += "\n\nUSER LOCATION CONTEXT:\nThe user is currently located in: " + userLocation + ".\nIf they ask for local information (weather, places, etc.), use this location.\n";
        }

        // Google Calendar Injection
        boolean needsCalendar = userMessageText.matches("(?i).*\\b(calendar|schedule|meeting|meetings|events|appointments|agenda)\\b.*");
        if (needsCalendar && user != null && user.getGoogleAccessToken() != null && !user.getGoogleAccessToken().isBlank()) {
            String calendarData = googleCalendarService.getUpcomingEvents(user.getGoogleAccessToken());
            systemPrompt += "\n\nCRITICAL CALENDAR CONTEXT:\nThe user asked about their schedule or calendar. Here are their upcoming Google Calendar events:\n" + calendarData + "\nUse this to answer their question.\n";
        }

        // Live Web Search Injection
        boolean needsSearch = userMessageText.matches("(?i).*\\b(who|what|where|when|current|today|2024|2025|2026|latest|news|won|election|president|price|how|is|does|will)\\b.*");
        if (needsSearch) {
            String currentYear = String.valueOf(java.time.LocalDate.now().getYear());
            String queryForSearch = userMessageText;
            
            // Force the search engine to pull the absolute newest data to combat LLM training cutoffs
            if (!userMessageText.toLowerCase().matches(".*\\b(current|today|latest|now|2024|2025|2026)\\b.*")) {
                queryForSearch += " latest current updates " + currentYear;
            } else if (!userMessageText.contains(currentYear)) {
                queryForSearch += " " + currentYear;
            }
            
            String searchResults = webSearchService.search(queryForSearch);
            if (searchResults != null) {
                systemPrompt += """
                                

                                =========================================
                                CRITICAL LIVE WEB SEARCH RESULTS
                                =========================================
                                You MUST use the following real-time data to answer the user's query.
                                This data is from the live internet and OVERRIDES your outdated internal training data.

                                """ + searchResults + "\n=========================================\n";
            }
        }

        List<Map<String, Object>> messagesList = new ArrayList<>();
        messagesList.add(Map.of("role", "system", "content", systemPrompt));
        for (int i = 0; i < history.size(); i++) {
            Message msg = history.get(i);
            String role = "USER".equals(msg.getRole()) ? "user" : "assistant";
            String content = msg.getContent();
            
            // If images are disabled, hide previous image tags from the AI to prevent it from copying its past behavior
            if (!contextImageEnabled && "assistant".equals(role)) {
                content = content.replaceAll("!\\[.*?\\]\\(wiki:[^)]+\\)", "").trim();
            }
            
            if ("user".equals(role) && i == history.size() - 1 && attachedImageBase64 != null && !attachedImageBase64.isBlank()) {
                messagesList.add(Map.of(
                    "role", role,
                    "content", List.of(
                        Map.of("type", "text", "text", content),
                        Map.of("type", "image_url", "image_url", Map.of("url", attachedImageBase64))
                    )
                ));
            } else {
                messagesList.add(Map.of("role", role, "content", content));
            }
        }

        String selectedModel = (aiModel != null && !aiModel.isBlank()) ? aiModel : groqModel;
        if (attachedImageBase64 != null && !attachedImageBase64.isBlank()) {
            selectedModel = "llama-3.2-11b-vision-preview";
        }
        Map<String, Object> requestBody = Map.of(
            "model", selectedModel,
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
        .doFinally(signalType -> {
            // Save assistant message to MongoDB
            Message asstMessage = new Message(conversation.getId(), "ASSISTANT", fullResponse.toString());
            messageRepository.save(asstMessage);
            conversation.setUpdatedAt(java.time.LocalDateTime.now());
            conversationRepository.save(conversation);

            // Trigger async summarization for older messages
            if (memoryEnabled) {
                memoryService.summarizeOldMessages(conversation.getId());
            }
        });
    }

    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public List<Message> getConversationMessages(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        if (!conv.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation does not belong to the current user");
        }
        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
    }

    public void deleteConversation(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        if (!conv.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation does not belong to the current user");
        }
        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.delete(conv);
    }

    public Conversation renameConversation(String conversationId, String userId, String newTitle) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        if (!conv.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation does not belong to the current user");
        }
        conv.setTitle(newTitle);
        conv.setUpdatedAt(java.time.LocalDateTime.now());
        return conversationRepository.save(conv);
    }
}
