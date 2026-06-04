package com.paiva.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ImageSearchService {

    private final HttpClient client = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();
            
    private final ObjectMapper objectMapper = new ObjectMapper();

    @SuppressWarnings({"UseSpecificCatch", "CallToPrintStackTrace"})
    public List<String> searchImages(String query) {
        List<String> imageUrls = new ArrayList<>();
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            
            // Step 1: Hit DuckDuckGo HTML to get the VQD token
            HttpRequest request1 = HttpRequest.newBuilder()
                .uri(URI.create("https://duckduckgo.com/?q=" + encodedQuery))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .GET()
                .build();
                
            HttpResponse<String> response1 = client.send(request1, HttpResponse.BodyHandlers.ofString());
            
            Matcher m = Pattern.compile("vqd=([\\d-]+)").matcher(response1.body());
            if (!m.find()) {
                return imageUrls; // Return empty if no VQD token is found
            }
            String vqd = m.group(1);
            
            // Step 2: Use the VQD token to search DuckDuckGo Images
            HttpRequest request2 = HttpRequest.newBuilder()
                .uri(URI.create("https://duckduckgo.com/i.js?l=us-en&o=json&q=" + encodedQuery + "&vqd=" + vqd + "&f=,,,,,&p=1"))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .GET()
                .build();
                
            HttpResponse<String> response2 = client.send(request2, HttpResponse.BodyHandlers.ofString());
            
            JsonNode root = objectMapper.readTree(response2.body());
            JsonNode results = root.path("results");
            
            // Extract the top 5 image URLs
            for (int i = 0; i < Math.min(5, results.size()); i++) {
                String imgUrl = results.get(i).path("image").asText();
                if (imgUrl != null && !imgUrl.isEmpty()) {
                    imageUrls.add(imgUrl);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return imageUrls;
    }
}
