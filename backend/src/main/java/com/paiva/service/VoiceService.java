package com.paiva.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class VoiceService {

    private final WebClient webClient;

    @Value("${spring.ai.openai.api-key}")
    private String groqApiKey;

    public VoiceService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://api.groq.com").build();
    }

    public String transcribeAudio(MultipartFile file) {
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio.webm";
                }
            });
            builder.part("model", "whisper-large-v3");

            MultiValueMap<String, HttpEntity<?>> multipartBody = builder.build();

            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri("/openai/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .bodyValue(multipartBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("text")) {
                return (String) response.get("text");
            }
            return "";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to transcribe audio: " + e.getMessage());
        }
    }
}
