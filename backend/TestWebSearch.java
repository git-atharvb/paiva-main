import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class TestWebSearch {
    public static void main(String[] args) throws Exception {
        String query = args.length > 0 ? args[0] : "who is current president of america";
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://html.duckduckgo.com/html/?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)))
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
            .GET()
            .build();
            
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        String html = response.body();
        
        System.out.println("Query: " + query);
        
        Pattern pattern = Pattern.compile("<a class=\"result__snippet\"[^>]*>(.*?)</a>", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(html);
        
        int count = 0;
        while (matcher.find() && count < 3) {
            String snippet = matcher.group(1).replaceAll("<[^>]*>", "").trim();
            snippet = snippet.replace("&#x27;", "'").replace("&quot;", "\"").replace("&amp;", "&");
            System.out.println("Snippet " + count + ": " + snippet);
            count++;
        }
        
        if (count == 0) {
            System.out.println("NO MATCHES FOUND!");
        }
    }
}
