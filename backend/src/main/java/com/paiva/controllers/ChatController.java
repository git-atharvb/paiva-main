package com.paiva.controllers;

import com.paiva.model.Conversation;
import com.paiva.model.Message;
import com.paiva.payload.request.ChatRequest;
import com.paiva.security.service.UserDetailsImpl;
import com.paiva.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestBody ChatRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return chatService.streamChat(request.getConversationId(), userDetails.getId(), request.getMessage());
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<Conversation>> getConversations() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        List<Conversation> conversations = chatService.getUserConversations(userDetails.getId());
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<Message>> getMessages(@PathVariable String conversationId) {
        List<Message> messages = chatService.getConversationMessages(conversationId);
        return ResponseEntity.ok(messages);
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<?> deleteConversation(@PathVariable String conversationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        chatService.deleteConversation(conversationId, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/conversations/{conversationId}")
    public ResponseEntity<Conversation> renameConversation(
            @PathVariable String conversationId,
            @RequestBody java.util.Map<String, String> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Conversation updated = chatService.renameConversation(conversationId, userDetails.getId(), payload.get("title"));
        return ResponseEntity.ok(updated);
    }
}
