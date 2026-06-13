package com.paiva.controllers;

import com.paiva.service.UtilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/utility")
public class UtilityController {

    private final UtilityService utilityService;

    public UtilityController(UtilityService utilityService) {
        this.utilityService = utilityService;
    }

    @PostMapping("/generate-text")
    public ResponseEntity<Map<String, String>> generateText(@RequestBody Map<String, String> payload) {
        String prompt = payload.get("prompt");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
        }
        
        String response = utilityService.generateText(prompt);
        return ResponseEntity.ok(Map.of("text", response));
    }

    @PostMapping("/generate-json")
    public ResponseEntity<Map<String, String>> generateJson(@RequestBody Map<String, String> payload) {
        String prompt = payload.get("prompt");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
        }
        
        String response = utilityService.generateJson(prompt);
        return ResponseEntity.ok(Map.of("text", response));
    }
}
