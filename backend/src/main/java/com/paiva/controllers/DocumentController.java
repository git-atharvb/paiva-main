package com.paiva.controllers;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.extractor.ExtractorFactory;
import org.apache.poi.extractor.POITextExtractor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @PostMapping("/extract")
    @SuppressWarnings({"UseSpecificCatch", "CallToPrintStackTrace"})
    public ResponseEntity<?> extractText(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid file name"));
        }

        String extractedText = "";

        try {
            if (fileName.toLowerCase().endsWith(".pdf")) {
                try (PDDocument document = PDDocument.load(file.getInputStream())) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    extractedText = stripper.getText(document);
                }
            } else if (fileName.toLowerCase().endsWith(".txt") || fileName.toLowerCase().endsWith(".csv")) {
                extractedText = new String(file.getBytes(), StandardCharsets.UTF_8);
            } else if (fileName.toLowerCase().matches(".*\\.(doc|docx|xls|xlsx|ppt|pptx)$")) {
                File tempFile = File.createTempFile("upload-", fileName);
                try {
                    file.transferTo(tempFile);
                    try (POITextExtractor extractor = ExtractorFactory.createExtractor(tempFile)) {
                        extractedText = extractor.getText();
                    }
                } catch (Exception ex) {
                    throw new IOException("Failed to extract text from Office document", ex);
                } finally {
                    tempFile.delete();
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file type"));
            }

            // Truncate text to 25,000 characters to avoid Groq token limit exhaustion
            if (extractedText.length() > 25000) {
                extractedText = extractedText.substring(0, 25000) + "\n\n[TRUNCATED DUE TO LENGTH LIMITS]";
            }

            return ResponseEntity.ok(Map.of("text", extractedText.trim()));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to parse document"));
        }
    }
}
