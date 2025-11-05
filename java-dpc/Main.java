import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

public class Main {
    static String SHEET_CSV_URL = env("SHEET_CSV_URL", "");
    static Integer SHEET_HEADER_ROW = parseInt(env("SHEET_HEADER_ROW", "6")); // 1-based

    public static void main(String[] args) throws Exception {
        int port = parseInt(env("PORT", "8080"));

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/healthz", exchange -> {
            write(exchange, 200, "ok", "text/plain; charset=utf-8");
        });

        server.createContext("/api/sheet-range", new RangeHandler());

        server.start();
        System.out.println("Java server listening on port " + port);
    }

    static class RangeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                    write(exchange, 405, "{}", "application/json");
                    return;
                }
                Map<String, String> q = parseQuery(exchange.getRequestURI());
                String start = q.getOrDefault("start", "C7");
                String end = q.getOrDefault("end", "D11");

                String csv = fetchCsv(SHEET_CSV_URL);
                List<List<String>> rows = parseCsv(csv);

                int[] s = a1ToIdx(start);
                int[] e = a1ToIdx(end);
                if (s == null || e == null) {
                    write(exchange, 400, jsonError("Parâmetros start/end inválidos"), "application/json");
                    return;
                }
                int r0 = Math.min(s[0], e[0]);
                int r1 = Math.max(s[0], e[0]);
                int c0 = Math.min(s[1], e[1]);
                int c1 = Math.max(s[1], e[1]);

                // headers
                List<String> headers = new ArrayList<>();
                for (int c = c0; c <= c1; c++) {
                    String label = null;
                    if (SHEET_HEADER_ROW != null && SHEET_HEADER_ROW - 1 < rows.size()) {
                        List<String> headerRow = rows.get(SHEET_HEADER_ROW - 1);
                        if (c < headerRow.size()) label = headerRow.get(c);
                    }
                    if (label == null || label.isBlank()) label = toColName(c);
                    headers.add(label);
                }

                List<List<String>> data = new ArrayList<>();
                for (int r = r0; r <= r1; r++) {
                    List<String> line = new ArrayList<>();
                    List<String> src = r < rows.size() ? rows.get(r) : Collections.emptyList();
                    for (int c = c0; c <= c1; c++) {
                        line.add(c < src.size() ? String.valueOf(src.get(c)) : "");
                    }
                    data.add(line);
                }

                StringBuilder sb = new StringBuilder();
                sb.append('{');
                sb.append("\"headers\":[");
                for (int i = 0; i < headers.size(); i++) {
                    if (i > 0) sb.append(',');
                    sb.append('"').append(escape(headers.get(i))).append('"');
                }
                sb.append("],\"rows\":[");
                for (int i = 0; i < data.size(); i++) {
                    if (i > 0) sb.append(',');
                    sb.append('[');
                    List<String> row = data.get(i);
                    for (int j = 0; j < row.size(); j++) {
                        if (j > 0) sb.append(',');
                        sb.append('"').append(escape(row.get(j))).append('"');
                    }
                    sb.append(']');
                }
                sb.append("]}");

                write(exchange, 200, sb.toString(), "application/json; charset=utf-8");
            } catch (Exception ex) {
                write(exchange, 500, jsonError("Falha ao obter intervalo: " + ex.getMessage()), "application/json");
            }
        }
    }

    static String jsonError(String msg) {
        return "{\"error\":\"" + escape(msg) + "\"}";
    }

    static String fetchCsv(String url) throws Exception {
        if (url == null || url.isBlank()) return "";
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("cache-control", "no-cache")
                .build();
        HttpResponse<byte[]> resp = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
            return new String(resp.body(), StandardCharsets.UTF_8);
        }
        throw new IOException("HTTP " + resp.statusCode());
    }

    static Map<String, String> parseQuery(URI uri) {
        Map<String, String> out = new HashMap<>();
        String q = uri.getRawQuery();
        if (q == null || q.isBlank()) return out;
        for (String p : q.split("&")) {
            String[] kv = p.split("=", 2);
            String k = decode(kv[0]);
            String v = kv.length > 1 ? decode(kv[1]) : "";
            out.put(k, v);
        }
        return out;
    }

    static String decode(String s) {
        try {
            return java.net.URLDecoder.decode(s, StandardCharsets.UTF_8);
        } catch (Exception ignored) { return s; }
    }

    static List<List<String>> parseCsv(String text) {
        List<List<String>> rows = new ArrayList<>();
        if (text == null) return rows;
        String[] lines = text.split("\r?\n", -1);
        for (String line : lines) rows.add(parseCsvLine(line));
        return rows;
    }

    static List<String> parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        if (line == null) { out.add(""); return out; }
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (inQuotes) {
                if (ch == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') { // escaped quote
                        cur.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    cur.append(ch);
                }
            } else {
                if (ch == ',') {
                    out.add(cur.toString());
                    cur.setLength(0);
                } else if (ch == '"') {
                    inQuotes = true;
                } else {
                    cur.append(ch);
                }
            }
        }
        out.add(cur.toString());
        return out;
    }

    static int[] a1ToIdx(String a1) {
        if (a1 == null) return null;
        a1 = a1.trim();
        if (!a1.matches("^[A-Za-z]+\\d+$")) return null;
        String colStr = a1.replaceAll("\\d", "").toUpperCase();
        String rowStr = a1.replaceAll("[^\\d]", "");
        int col = 0;
        for (int i = 0; i < colStr.length(); i++) col = col * 26 + (colStr.charAt(i) - 'A' + 1);
        int row = Integer.parseInt(rowStr);
        return new int[]{row - 1, col - 1};
    }

    static String toColName(int idx) {
        int n = idx + 1; String s = "";
        while (n > 0) { int rem = (n - 1) % 26; s = (char) ('A' + rem) + s; n = (n - 1) / 26; }
        return s;
    }

    static void write(HttpExchange ex, int code, String body, String contentType) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", contentType);
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    static String env(String k, String def) { String v = System.getenv(k); return v != null ? v : def; }
    static Integer parseInt(String s) { try { return Integer.parseInt(s); } catch (Exception e) { return null; } }
}

