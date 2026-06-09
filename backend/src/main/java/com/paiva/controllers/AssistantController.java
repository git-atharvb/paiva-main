package com.paiva.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    @GetMapping("/models")
    public ResponseEntity<List<Map<String, String>>> getModels() {
        return ResponseEntity.ok(List.of(
            Map.of("id", "", "name", "Auto (Default)", "capability", "Uses your configured default model"),
            Map.of("id", "llama-3.3-70b-versatile", "name", "Llama 3.3 70B", "capability", "Strong general reasoning"),
            Map.of("id", "llama-3.1-8b-instant", "name", "Llama 3.1 8B", "capability", "Fast everyday help"),
            Map.of("id", "deepseek-r1-distill-llama-70b", "name", "DeepSeek R1 70B", "capability", "Reasoning-heavy tasks"),
            Map.of("id", "mixtral-8x7b-32768", "name", "Mixtral 8x7B", "capability", "Balanced long-context work"),
            Map.of("id", "gemma2-9b-it", "name", "Google Gemma 2 9B", "capability", "Concise instruction following"),
            Map.of("id", "qwen-2.5-32b", "name", "Qwen 2.5 32B", "capability", "Research and synthesis"),
            Map.of("id", "qwen-2.5-coder-32b", "name", "Qwen 2.5 Coder 32B", "capability", "Coding assistance")
        ));
    }
}
