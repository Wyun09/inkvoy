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
        AtomicReference<String> lastPath = new AtomicReference<>();
        AtomicReference<String> lastKey = new AtomicReference<>();
        CountDownLatch acceptedCancelled = new CountDownLatch(1), cancelled = new CountDownLatch(1);
        AtomicReference<String> cancelledId = new AtomicReference<>();
        LoopbackServer.Dispatcher dispatcher = new LoopbackServer.Dispatcher() {
            public void dispatchRequest(String id, String path, String body, String key, LoopbackServer.Exchange response) {
                lastKey.set(key); dispatch(id, path, body, response);
            }
            public void dispatch(String id, String path, String body, LoopbackServer.Exchange response) {
                dispatched.incrementAndGet();
                lastPath.set(path);
                if (body.contains("cancel-test")) { cancelledId.set(id); acceptedCancelled.countDown(); return; }
                if (body.contains("abort-stream-test")) {
                    response.stream(); response.data("data: {\"content\":\"partial\"}\n\n");
                    new Thread(() -> { try { Thread.sleep(20); response.abort("{\"type\":\"error\",\"error\":{\"code\":\"engine_restarted\"}}"); } catch (Exception e) { throw new RuntimeException(e); } }).start(); return;
                }
                if (body.contains("abort-json-test")) { response.abort("{\"error\":{\"code\":\"engine_restarted\"}}"); return; }
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
            String apiKey = "x-api-key: test-key-local-only\r\n";
            check(call(port, "GET", "/v1/models", apiKey, null).contains("deepseek-web"), "Anthropic x-api-key authentication works");
            check(call(port, "POST", "/v1/messages?beta=true", auth, "{}").contains("accepted") && lastPath.get().equals("/v1/messages"), "Claude Code beta query reaches the normalized Messages route");
            check(call(port, "POST", "/v1/messages/count_tokens?beta=true", apiKey, "{}").contains("accepted") && lastPath.get().equals("/v1/messages/count_tokens"), "token counting uses the same native transport");
            check(call(port, "POST", "/v1/messages", "", "{}").contains("\"type\":\"authentication_error\""), "Messages authentication errors use the Anthropic error envelope");
            check(call(port, "POST", "/v1/messages", auth + "x-api-key: wrong\r\n", "{}").contains("401 Error"), "conflicting credentials are rejected even with a valid Bearer token");
            check(call(port, "POST", "/v1/messages", "Authorization: Bearer wrong\r\n" + apiKey, "{}").contains("401 Error"), "conflicting credentials are rejected even with a valid x-api-key");
            check(call(port, "POST", "/v1/messages", auth + apiKey, "{}").contains("accepted"), "matching dual credentials are accepted");
            check(call(port, "GET", "/health", "Origin: https://untrusted.example\r\n", null).contains("403 Error"), "web origins cannot call the local server");
            check(call(port, "GET", "/health", "Host: attacker.example\r\n", null).contains("400 Error"), "duplicate Host headers fail closed");
            check(call(port, "POST", "/v1/chat/completions", auth, "{\"messages\":[]}").contains("accepted"), "JSON body reaches the dispatcher");
            check(call(port, "POST", "/v1/chat/completions", auth + "Content-Length: 16777217\r\n", null).contains("413 Error"), "oversized bodies rejected before reading or truncating");
            check(call(port, "POST", "/v1/chat/completions", auth + "Transfer-Encoding: chunked\r\n", null).contains("415 Error"), "unsupported transfer encoding rejected");
            check(call(port, "DELETE", "/v1/chat/completions", auth, null).contains("404 Error"), "unsupported methods rejected");
            check(call(port, "GET", "/v1/bridge/tasks", "", null).contains("401 Error"), "task history requires authentication");
            check(call(port, "GET", "/v1/bridge/tasks?limit=32", auth, null).contains("accepted") && lastPath.get().equals("/v1/bridge/tasks"), "task list reaches the authenticated engine route");
            check(call(port, "GET", "/v1/bridge/tasks/task_fixture", auth, null).contains("accepted"), "task detail route is accepted");
            check(call(port, "GET", "/v1/bridge/tasks/task_fixture/result", auth, null).contains("accepted"), "saved result route is accepted");
            check(call(port, "POST", "/v1/bridge/tasks/task_fixture/cancel", auth, null).contains("accepted"), "cancel does not require an invented JSON body");
            check(call(port, "POST", "/v1/bridge/tasks/task_fixture/retry", auth, "{}").contains("accepted"), "retry route reaches the engine");
            check(call(port, "GET", "/v1/bridge/tasks/task_fixture/cancel", auth, null).contains("404 Error"), "GET cannot cancel a task");
            check(call(port, "DELETE", "/v1/bridge/tasks/task_fixture", auth, null).contains("404 Error"), "unsupported task mutation is rejected");
            check(call(port, "POST", "/v1/chat/completions", auth + "Idempotency-Key: operation-123\r\n", "{}").contains("accepted") && "operation-123".equals(lastKey.get()), "explicit idempotency key reaches dispatch separately from credentials");
            check(call(port, "POST", "/v1/chat/completions", auth + "Idempotency-Key: has spaces\r\n", "{}").contains("invalid_idempotency_key"), "invalid idempotency key rejected before dispatch");
            check(call(port, "POST", "/v1/chat/completions", auth + "Idempotency-Key: " + new String(new char[129]).replace('\0', 'a') + "\r\n", "{}").contains("invalid_idempotency_key"), "oversized idempotency key is bounded");
            check(call(port, "POST", "/v1/chat/completions", auth, "{\"abort-json-test\":true}").contains("503 Error"), "engine exit before streaming returns explicit 503");
            String interrupted = call(port, "POST", "/v1/chat/completions", auth, "{\"abort-stream-test\":true}");
            check(interrupted.contains("partial") && interrupted.contains("event: error") && interrupted.contains("engine_restarted") && !interrupted.contains("[DONE]"), "engine exit after partial SSE sends an error without claiming normal completion");
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
