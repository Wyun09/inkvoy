package io.github.deepseekbridge;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;

/** A small, loopback-only HTTP/1.1 transport. No page or native APIs are exposed
 * before Bearer authentication. Connections close after each response. */
public final class LoopbackServer implements Closeable {
    public interface Dispatcher {
        void dispatch(String id, String path, String body, Exchange exchange);
        void cancel(String id);
    }
    private final Dispatcher dispatcher;
    private final byte[] key;
    private final ServerSocket listener;
    private final ExecutorService workers;
    private final ExecutorService monitors;
    private final Set<Socket> sockets = Collections.newSetFromMap(new ConcurrentHashMap<Socket, Boolean>());
    private volatile boolean closed;
    public static final int MAX_BODY = 16 * 1024 * 1024;

    public LoopbackServer(int port, String apiKey, Dispatcher dispatcher) throws IOException {
        this.dispatcher = dispatcher;
        this.key = apiKey.getBytes(StandardCharsets.UTF_8);
        listener = new ServerSocket();
        listener.setReuseAddress(true);
        listener.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), port), 16);
        ThreadFactory factory = task -> { Thread t = new Thread(task, "android-bridge-http"); t.setDaemon(true); return t; };
        workers = new ThreadPoolExecutor(8, 16, 30, TimeUnit.SECONDS, new ArrayBlockingQueue<Runnable>(16), factory);
        monitors = Executors.newCachedThreadPool(factory);
        Thread acceptor = factory.newThread(() -> {
            while (!closed) {
                try {
                    Socket socket = listener.accept();
                    sockets.add(socket);
                    try { workers.execute(() -> serve(socket)); }
                    catch (RejectedExecutionException e) { sockets.remove(socket); socket.close(); }
                } catch (IOException e) { if (!closed) closeQuietly(); }
            }
        });
        acceptor.start();
    }
    public int port() { return listener.getLocalPort(); }
    private void closeQuietly() { try { close(); } catch (IOException ignored) {} }

    private static String line(InputStream input, int[] budget) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        for (;;) {
            int ch = input.read();
            if (ch < 0) throw new EOFException();
            if (--budget[0] < 0) throw new IOException("Headers too large");
            if (ch == '\n') break;
            if (ch != '\r') bytes.write(ch);
        }
        return new String(bytes.toByteArray(), StandardCharsets.ISO_8859_1);
    }
    private static String error(String code, String message) {
        String type = code.equals("invalid_api_key") ? "authentication_error" : code.equals("not_found") ? "not_found_error" : code.equals("body_too_large") ? "request_too_large" : code.equals("invalid_host") || code.equals("browser_origin_denied") ? "permission_error" : "invalid_request_error";
        return "{\"type\":\"error\",\"error\":{\"type\":\"" + type + "\",\"code\":\"" + code + "\",\"message\":\"" + message + "\"}}";
    }
    private static void json(OutputStream output, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        String header = "HTTP/1.1 " + status + " " + (status < 400 ? "OK" : "Error") + "\r\nContent-Type: application/json; charset=utf-8\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\nContent-Length: " + bytes.length + "\r\n\r\n";
        output.write(header.getBytes(StandardCharsets.US_ASCII)); output.write(bytes); output.flush();
    }
    private void serve(Socket socket) {
        Exchange exchange = null;
        try (Socket connection = socket) {
            connection.setSoTimeout(15000); connection.setTcpNoDelay(true);
            InputStream input = connection.getInputStream(); OutputStream output = connection.getOutputStream();
            int[] budget = { 16384 };
            String[] requestLine = line(input, budget).split(" ");
            if (requestLine.length != 3 || !requestLine[2].equals("HTTP/1.1")) { json(output, 400, error("invalid_http", "Use HTTP/1.1.")); return; }
            String method = requestLine[0], path = requestLine[1];
            int query = path.indexOf('?'); if (query >= 0) path = path.substring(0, query);
            Map<String, String> headers = new HashMap<>();
            for (;;) {
                String value = line(input, budget); if (value.isEmpty()) break;
                int colon = value.indexOf(':');
                if (colon < 1) { json(output, 400, error("invalid_headers", "Malformed headers.")); return; }
                String name = value.substring(0, colon).trim().toLowerCase(Locale.ROOT);
                if (headers.put(name, value.substring(colon + 1).trim()) != null) { json(output, 400, error("duplicate_header", "Duplicate headers rejected.")); return; }
            }
            String host = headers.getOrDefault("host", "");
            if (!host.matches("(?i)(127\\.0\\.0\\.1|localhost)(:" + port() + ")?")) { json(output, 403, error("invalid_host", "Only local hosts are accepted.")); return; }
            if (headers.containsKey("origin")) { json(output, 403, error("browser_origin_denied", "Use a native client or its backend.")); return; }
            if (method.equals("GET") && path.equals("/health")) { json(output, 200, "{\"status\":\"ok\",\"version\":\"0.4.0-android\"}"); return; }
            if (method.equals("GET") && (path.equals("/") || path.equals("/v1") || path.equals("/v1/"))) { json(output, 200, "{\"status\":\"ok\",\"model\":\"deepseek-web\"}"); return; }
            String authorization = headers.getOrDefault("authorization", "");
            byte[] supplied = authorization.regionMatches(true, 0, "Bearer ", 0, 7) ? authorization.substring(7).getBytes(StandardCharsets.UTF_8) : new byte[0];
            String apiKey = headers.getOrDefault("x-api-key", "");
            boolean hasBearer = !authorization.isEmpty(), hasApiKey = !apiKey.isEmpty();
            boolean bearerMatches = MessageDigest.isEqual(key, supplied);
            boolean apiKeyMatches = MessageDigest.isEqual(key, apiKey.getBytes(StandardCharsets.UTF_8));
            if ((!hasBearer && !hasApiKey) || hasBearer && !bearerMatches || hasApiKey && !apiKeyMatches) { json(output, 401, error("invalid_api_key", "A valid local Bearer or x-api-key credential is required.")); return; }
            if (method.equals("GET") && path.equals("/v1/models")) { json(output, 200, "{\"object\":\"list\",\"data\":[{\"id\":\"deepseek-web\",\"object\":\"model\",\"owned_by\":\"android-webview-bridge\",\"capabilities\":{\"vision\":true,\"reasoning\":true,\"web_search\":true}}]}"); return; }
            boolean completion = method.equals("POST") && (path.equals("/v1/chat/completions") || path.equals("/v1/messages") || path.equals("/v1/messages/count_tokens"));
            boolean browser = method.equals("GET") && path.equals("/browser/status") || method.equals("POST") && path.equals("/browser/open");
            if (!completion && !browser) { json(output, 404, error("not_found", "Unsupported API path.")); return; }
            if (headers.containsKey("transfer-encoding") || headers.containsKey("content-encoding") && !headers.get("content-encoding").equalsIgnoreCase("identity")) { json(output, 415, error("unsupported_encoding", "Use an uncompressed Content-Length body.")); return; }
            long length;
            try { length = Long.parseLong(headers.getOrDefault("content-length", "0")); }
            catch (NumberFormatException e) { json(output, 400, error("invalid_length", "Invalid content length.")); return; }
            if (length < 0 || length > MAX_BODY) { json(output, 413, error("body_too_large", "Android transport limit is 16 MiB; history was not truncated.")); return; }
            if (completion && (length == 0 || !headers.getOrDefault("content-type", "").toLowerCase(Locale.ROOT).startsWith("application/json"))) { json(output, 400, error("invalid_body", "Send application/json.")); return; }
            byte[] body = new byte[(int) length];
            int offset = 0;
            while (offset < body.length) { int count = input.read(body, offset, body.length - offset); if (count < 0) throw new EOFException(); offset += count; }
            String id = UUID.randomUUID().toString();
            exchange = new Exchange(id, connection);
            Exchange job = exchange;
            connection.setSoTimeout(1000);
            monitors.execute(() -> {
                while (!job.finished && !closed) {
                    try { if (input.read() < 0) { job.disconnect(); break; } }
                    catch (SocketTimeoutException ignored) {}
                    catch (IOException e) { if (!job.finished) job.disconnect(); break; }
                }
            });
            dispatcher.dispatch(id, path, new String(body, StandardCharsets.UTF_8), job);
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(620);
            boolean streaming = false;
            while (!job.finished && System.nanoTime() < deadline) {
                Frame frame = job.frames.poll(1, TimeUnit.SECONDS);
                if (frame == null) continue;
                if (frame.kind.equals("response")) { if (!streaming) json(output, frame.status, frame.data); break; }
                if (frame.kind.equals("stream")) {
                    if (streaming) continue;
                    streaming = true;
                    output.write("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream; charset=utf-8\r\nCache-Control: no-cache, no-transform\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\n\r\n".getBytes(StandardCharsets.US_ASCII)); output.flush();
                } else if (frame.kind.equals("data")) {
                    if (!streaming) throw new IOException("Stream has not begun");
                    output.write(frame.data.getBytes(StandardCharsets.UTF_8)); output.flush();
                } else if (frame.kind.equals("end")) break;
            }
        } catch (Exception ignored) {
            // Do not log request bodies, credentials, or private page content.
        } finally {
            if (exchange != null) { exchange.finished = true; dispatcher.cancel(exchange.id); }
            sockets.remove(socket);
        }
    }
    private static final class Frame {
        final String kind, data; final int status;
        Frame(String kind, int status, String data) { this.kind = kind; this.status = status; this.data = data; }
    }
    public final class Exchange {
        public final String id;
        private final Socket socket;
        private final BlockingQueue<Frame> frames = new ArrayBlockingQueue<>(128);
        private volatile boolean finished;
        Exchange(String id, Socket socket) { this.id = id; this.socket = socket; }
        private void post(Frame frame) { if (!finished && !frames.offer(frame)) disconnect(); }
        public void response(int status, String body) { post(new Frame("response", status, body)); }
        public void stream() { post(new Frame("stream", 200, "")); }
        public void data(String text) { post(new Frame("data", 200, text)); }
        public void end() { post(new Frame("end", 200, "")); }
        void disconnect() { if (!finished) { finished = true; dispatcher.cancel(id); try { socket.close(); } catch (IOException ignored) {} } }
    }
    @Override public void close() throws IOException {
        closed = true; listener.close();
        for (Socket socket : sockets) try { socket.close(); } catch (IOException ignored) {}
        workers.shutdownNow(); monitors.shutdownNow();
    }
}
