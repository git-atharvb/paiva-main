package com.paiva.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GoogleCalendarService {

    private final WebClient webClient;

    public GoogleCalendarService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://www.googleapis.com").build();
    }

    public String getUpcomingEvents(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return "No Google Calendar access token provided. The user needs to connect their calendar in settings.";
        }

        try {
            String timeMin = ZonedDateTime.now().format(DateTimeFormatter.ISO_INSTANT);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/calendar/v3/calendars/primary/events")
                    .queryParam("timeMin", timeMin)
                    .queryParam("maxResults", 10)
                    .queryParam("singleEvents", true)
                    .queryParam("orderBy", "startTime")
                    .build())
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (response == null || !response.containsKey("items")) {
                return "No upcoming events found.";
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            
            if (items.isEmpty()) {
                return "No upcoming events found.";
            }

            return items.stream().map(item -> {
                String summary = (String) item.get("summary");
                Map<String, String> start = (Map<String, String>) item.get("start");
                String startTime = start != null && start.containsKey("dateTime") ? start.get("dateTime") : (start != null ? start.get("date") : "Unknown time");
                return "- " + summary + " at " + startTime;
            }).collect(Collectors.joining("\n"));

        } catch (Exception e) {
            return "Failed to fetch calendar events: " + e.getMessage();
        }
    }
}
