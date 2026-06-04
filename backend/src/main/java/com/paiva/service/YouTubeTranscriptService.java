package com.paiva.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

@Service
public class YouTubeTranscriptService {

    @SuppressWarnings({"UseSpecificCatch", "CallToPrintStackTrace"})
    public String fetchTranscript(String url) {
        try {
            // The script is located in paiva-main/scripts/fetch-transcript.cjs
            // We run it using Node.js
            String scriptPath = Paths.get("..", "scripts", "fetch-transcript.cjs").toAbsolutePath().toString();
            
            ProcessBuilder pb = new ProcessBuilder("node", scriptPath, url);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Read output
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            
            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            if (!finished) {
                process.destroy();
                return null;
            }
            
            if (process.exitValue() == 0) {
                return output.toString().trim();
            } else {
                System.err.println("Failed to fetch transcript: " + output.toString());
                return null;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public boolean isYouTubeUrl(String url) {
        if (url == null) return false;
        Pattern pattern = Pattern.compile("^(https?:\\/\\/)?(www\\.)?(youtube\\.com|youtu\\.be)\\/.+$", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(url);
        return matcher.matches();
    }
}
