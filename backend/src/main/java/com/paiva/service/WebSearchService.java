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

@Service
public class WebSearchService {

    private final HttpClient httpClient;

    public WebSearchService() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    @SuppressWarnings({"CallToPrintStackTrace", "UseSpecificCatch"})
    public String search(String query) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://html.duckduckgo.com/html/?q=" + encodedQuery))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String html = response.body();

            // Extract snippets using regex
            Pattern pattern = Pattern.compile("<a class=\"result__snippet\"[^>]*>(.*?)</a>", Pattern.DOTALL);
            Matcher matcher = pattern.matcher(html);
            
            List<String> snippets = new ArrayList<>();
            while (matcher.find() && snippets.size() < 3) {
                // Strip HTML tags (like <b>) from the snippet
                String snippet = matcher.group(1).replaceAll("<[^>]*>", "").trim();
                // Decode common HTML entities
                snippet = snippet.replace("&#x27;", "'").replace("&quot;", "\"").replace("&amp;", "&");
                if (!snippet.isBlank()) {
                    snippets.add("- " + snippet);
                }
            }

            if (snippets.isEmpty()) {
                return null;
            }

            return String.join("\n", snippets);

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
