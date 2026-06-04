package com.paiva.controllers;

import com.paiva.service.ImageSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageSearchService imageSearchService;

    public ImageController(ImageSearchService imageSearchService) {
        this.imageSearchService = imageSearchService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<String>> search(@RequestParam String q) {
        List<String> imageUrls = imageSearchService.searchImages(q);
        return ResponseEntity.ok(imageUrls);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadImage(@RequestParam String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0")
                .GET()
                .build();
                
            HttpResponse<byte[]> response = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(10))
                .build()
                .send(request, HttpResponse.BodyHandlers.ofByteArray());
                
            ByteArrayResource resource = new ByteArrayResource(response.body());
            
            // Extract extension if possible, default to jpg
            String ext = "jpg";
            if (url.toLowerCase().endsWith(".png")) ext = "png";
            else if (url.toLowerCase().endsWith(".gif")) ext = "gif";
            else if (url.toLowerCase().endsWith(".webp")) ext = "webp";
            
            MediaType mediaType = MediaType.IMAGE_JPEG;
            if (ext.equals("png")) mediaType = MediaType.IMAGE_PNG;
            else if (ext.equals("gif")) mediaType = MediaType.IMAGE_GIF;
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"downloaded_image." + ext + "\"")
                .contentType(mediaType)
                .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
