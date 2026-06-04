import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.w3c.dom.Element;
import java.io.ByteArrayInputStream;

public class YTTest {
    public static void main(String[] args) throws Exception {
        String videoId = "jNQXAC9IVRw"; // Me at the zoo
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create("https://www.youtube.com/watch?v=" + videoId))
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
            .header("Accept-Language", "en-US,en;q=0.5")
            .GET()
            .build();
            
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        String html = res.body();
        
        System.out.println("Downloaded HTML length: " + html.length());
        
        // Find captionTracks
        Pattern p = Pattern.compile("\"captionTracks\":\\[\\{\"baseUrl\":\"([^\"]+)\"");
        Matcher m = p.matcher(html);
        if (m.find()) {
            String baseUrl = m.group(1).replace("\\u0026", "&").replace("\\/", "/");
            System.out.println("Base URL: " + baseUrl);
            
            // Download XML
            HttpRequest xmlReq = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "&fmt=json3"))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .header("Accept-Language", "en-US,en;q=0.5")
                .GET()
                .build();
            HttpResponse<String> xmlRes = client.send(xmlReq, HttpResponse.BodyHandlers.ofString());
            String xml = xmlRes.body();
            
            System.out.println("Status Code: " + xmlRes.statusCode());
            System.out.println("XML Length: " + xml.length());
            
            if (xml.length() == 0) {
                System.out.println("Empty XML body. Headers:");
                xmlRes.headers().map().forEach((k, v) -> System.out.println(k + ": " + v));
                return;
            }
            
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes("UTF-8")));
            
            NodeList textNodes = doc.getElementsByTagName("text");
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < textNodes.getLength(); i++) {
                Element el = (Element) textNodes.item(i);
                // System.out.println(el.getTextContent());
                sb.append(el.getTextContent().replace("&amp;", "&").replace("&#39;", "'")).append(" ");
            }
            
            System.out.println("Transcript: " + sb.toString());
        } else {
            System.out.println("No captions found!");
        }
    }
}
