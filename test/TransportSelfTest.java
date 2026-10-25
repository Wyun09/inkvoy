import io.github.deepseekbridge.LoopbackServer;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public final class TransportSelfTest {
    static int assertions;
    static void check(boolean condition, String message) { if (!condition) throw new AssertionError(message); assertions++; System.out.println("PASS " + message); }
    static String call(int port, String method, String path, String extra, String body) throws Exception {
        try (Socket socket = new Socket("127.0.0.1", port)) {
            socket.setSoTimeout(3000);
            String request = method + " " + path + " HTTP/1.1\r\nHost: 127.0.0.1:" + port + "\r\n" + extra + (body == null ? "" : "Content-Type: application/json\r\nContent-Length: " + body.getBytes(StandardCharsets.UTF_8).length + "\r\n") + "\r\n" + (body == null ? "" : body);
            socket.getOutputStream().write(request.getBytes(StandardCharsets.UTF_8)); socket.getOutputStream().flush();
            ByteArrayOutputStream bytes = new ByteArrayOutputStream(); byte[] buffer = new byte[4096]; int count;
            while ((count = socket.getInputStream().read(buffer)) >= 0) bytes.write(buffer, 0, count);
            return new String(bytes.toByteArray(), StandardCharsets.UTF_8);
        }
    }
    public static void main(String[] args) throws Exception {
        String auth = "Authorization: Bearer test-key-local-only\r\n";
        AtomicInteger dispatched = new AtomicInteger();
        CountDownLatch acceptedCancelled = new CountDownLatch(1), cancelled = new CountDownLatch(1);
        AtomicReference<String> cancelledId = new AtomicReference<>();
        LoopbackServer.Dispatcher dispatcher = new LoopbackServer.Dispatcher() {
            public void dispatch(String id, String path, String body, LoopbackServer.Exchange response) {
                dispatched.incrementAndGet();
                if (body.contains("cancel-test")) { cancelledId.set(id); acceptedCancelled.countDown(); return; }
                if (body.contains("stream-test")) {
                    response.stream(); response.data("data: {\"content\":\"one\"}\n\n");
                    new Thread(() -> { try { Thread.sleep(80); response.data("data: {\"content\":\"two\"}\n\ndata: [DONE]\n\n"); response.end(); } catch (Exception e) { throw new RuntimeException(e); } }).start(); return;
                }
                response.response(200, "{\"accepted\":true}");
            }
            public void cancel(String id) { if (id.equals(cancelledId.get())) cancelled.countDown(); }
        };
        try (LoopbackServer server = new LoopbackServer(0, "test-key-local-only", dispatcher)) {
            int port = server.port();
            check(call(port, "GET", "/health", "", null).contains("200 OK"), "public health responds");
            check(call(port, "GET", "/v1/models", "", null).contains("401 Error"), "models require authentication");
            check(call(port, "GET", "/v1/models", auth, null).contains("deepseek-web"), "authenticated model discovery");
            check(call(port, "GET", "/v1/models", "Authorization: bearer test-key-local-only\r\n", null).contains("200 OK"), "Bearer scheme is case insensitive");
            check(call(port, "GET", "/health", "Origin: https://untrusted.example\r\n", null).contains("403 Error"), "web origins cannot call the local server");
            check(call(port, "GET", "/health", "Host: attacker.example\r\n", null).contains("400 Error"), "duplicate Host headers fail closed");
            check(call(port, "POST", "/v1/chat/completions", auth, "{\"messages\":[]}").contains("accepted"), "JSON body reaches the dispatcher");
            check(call(port, "POST", "/v1/chat/completions", auth + "Content-Length: 16777217\r\n", null).contains("413 Error"), "oversized bodies rejected before reading or truncating");
            check(call(port, "POST", "/v1/chat/completions", auth + "Transfer-Encoding: chunked\r\n", null).contains("415 Error"), "unsupported transfer encoding rejected");
            check(call(port, "DELETE", "/v1/chat/completions", auth, null).contains("404 Error"), "unsupported methods rejected");
            int before = dispatched.get();
            call(port, "POST", "/v1/chat/completions", "Authorization: Bearer wrong\r\n", "{}");
            check(dispatched.get() == before, "unauthenticated bodies never reach the engine");
            try (Socket socket = new Socket("127.0.0.1", port)) {
                socket.setSoTimeout(3000);
                String body = "{\"stream-test\":true}";
                String request = "POST /v1/chat/completions HTTP/1.1\r\nHost: localhost:" + port + "\r\n" + auth + "Content-Type: application/json\r\nContent-Length: " + body.length() + "\r\n\r\n" + body;
                socket.getOutputStream().write(request.getBytes(StandardCharsets.UTF_8)); socket.getOutputStream().flush();
                BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                String header = reader.readLine(), value;
                while (!(value = reader.readLine()).isEmpty()) {}
                check(header.contains("200 OK") && reader.readLine().contains("one"), "first SSE content arrives before the final chunk");
                StringBuilder remaining = new StringBuilder(); while ((value = reader.readLine()) != null) remaining.append(value);
                check(remaining.toString().contains("two") && remaining.toString().contains("[DONE]"), "later SSE content and DONE are delivered");
            }
            Socket abandoned = new Socket("127.0.0.1", port);
            String body = "{\"cancel-test\":true}";
            String request = "POST /v1/chat/completions HTTP/1.1\r\nHost: localhost:" + port + "\r\n" + auth + "Content-Type: application/json\r\nContent-Length: " + body.length() + "\r\n\r\n" + body;
            abandoned.getOutputStream().write(request.getBytes(StandardCharsets.UTF_8)); abandoned.getOutputStream().flush();
            check(acceptedCancelled.await(2, TimeUnit.SECONDS), "cancellation fixture is accepted"); abandoned.close();
            check(cancelled.await(2, TimeUnit.SECONDS), "disconnect cancels work before any response exists");
        }
        System.out.println("TRANSPORT_PASS assertions=" + assertions);
    }
}
