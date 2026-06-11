package com.paiva.controllers;

import com.paiva.service.VoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"}, maxAge = 3600)
@RestController
@RequestMapping("/api/voice")
public class VoiceController {

    private final VoiceService voiceService;

    public VoiceController(VoiceService voiceService) {
        this.voiceService = voiceService;
    }

    @PostMapping("/transcribe")
    public ResponseEntity<?> transcribeAudio(@RequestParam("file") MultipartFile file) {
        try {
            String text = voiceService.transcribeAudio(file);
            return ResponseEntity.ok(Map.of("text", text));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
