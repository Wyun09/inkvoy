package io.github.deepseekbridge;

import android.content.*;
import android.os.*;
import android.net.Uri;
import android.view.*;
import android.webkit.*;
import org.json.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/** The local trusted engine and the remote page live in separate WebViews.
 * Only packaged, non-navigable assets have a native JavascriptInterface. */
public final class BridgeRuntime implements LoopbackServer.Dispatcher {
    private final Context context;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final MutableContextWrapper browserContext;
    public WebView browser;
    public final WebView engine;
    private final Map<String, LoopbackServer.Exchange> exchanges = new ConcurrentHashMap<>();
    private final Map<Integer, Runnable> timers = new HashMap<>();
    private final Map<Integer, Runnable> evaluations = new HashMap<>();
    private final PowerManager.WakeLock wakeLock;
    public Runnable onChange;
    public String state = "准备中";
    public boolean ready, running;
    private boolean requestedStart, destroyed;
    private LoopbackServer server;
    private int navigationId;
    private Runnable navigationTimeout;
    public final String apiKey;

    public BridgeRuntime(Context context) {
        this.context = context;
        SharedPreferences prefs = context.getSharedPreferences("local-bridge", Context.MODE_PRIVATE);
        String key = prefs.getString("key", null);
        if (key == null) { key = "android-" + UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""); prefs.edit().putString("key", key).apply(); }
        apiKey = key;
        PowerManager power = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "deepseek-bridge:request");
        wakeLock.setReferenceCounted(false);
        browserContext = new MutableContextWrapper(context);
        createBrowser();
        engine = new WebView(context);
        engine.getSettings().setJavaScriptEnabled(true);
        engine.getSettings().setAllowFileAccess(false);
        engine.getSettings().setAllowContentAccess(false);
        engine.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        engine.addJavascriptInterface(new NativeInterface(), "NativeBridge");
        engine.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !"bridge.local".equals(uri.getHost())) return blocked();
                String asset;
                if ("/engine.html".equals(uri.getPath())) asset = "engine.html";
                else if ("/engine.bundle.js".equals(uri.getPath())) asset = "engine.bundle.js";
                else return blocked();
                try { return new WebResourceResponse(asset.endsWith(".js") ? "application/javascript" : "text/html", "UTF-8", context.getAssets().open(asset)); }
                catch (IOException e) { return blocked(); }
            }
        });
        engine.loadUrl("https://bridge.local/engine.html");
    }
    private static WebResourceResponse blocked() { return new WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", Collections.emptyMap(), new ByteArrayInputStream(new byte[0])); }
    private boolean trustedEngine() { return "https://bridge.local/engine.html".equals(engine.getUrl()); }
    private static boolean deepseek(String url) { if (url == null) return false; Uri uri = Uri.parse(url); return "https".equals(uri.getScheme()) && "chat.deepseek.com".equals(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443); }
    private void changed() { if (onChange != null) onChange.run(); }
    public void attachContext(Context activity) { browserContext.setBaseContext(activity); }
    public void detachContext() { browserContext.setBaseContext(context); }

    private void createBrowser() {
        browser = new WebView(browserContext);
        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false); settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        // Use the normal Android WebView UA; no identity spoofing or account
        // tokens from Chrome/desktop are imported.
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(browser, false);
        browser.setWebChromeClient(new WebChromeClient());
        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return request.isForMainFrame() && !deepseek(request.getUrl().toString()); }
            @Override public void onPageFinished(WebView view, String url) {
                CookieManager.getInstance().flush();
                if (navigationId != 0) {
                    int id = navigationId; navigationId = 0;
                    if (navigationTimeout != null) main.removeCallbacks(navigationTimeout);
                    if (deepseek(url)) rpc(id, true, JSONObject.NULL); else fail(id, "UNEXPECTED_PAGE", "网页离开了 DeepSeek。");
                }
                state = running ? "桥运行中 · 网页已载入" : "网页已载入"; changed();
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                for (String id : new ArrayList<>(exchanges.keySet())) cancel(id);
                main.post(() -> resetBrowser()); return true;
            }
        });
        browser.loadUrl("https://chat.deepseek.com/");
    }
    private void resetBrowser() {
        for (Map.Entry<Integer, Runnable> entry : new ArrayList<>(evaluations.entrySet())) {
            main.removeCallbacks(entry.getValue()); fail(entry.getKey(), "REQUEST_CANCELLED", "旧网页已清理。");
        }
        evaluations.clear();
        if (navigationId != 0) { fail(navigationId, "REQUEST_CANCELLED", "旧网页导航已取消。"); navigationId = 0; }
        if (navigationTimeout != null) main.removeCallbacks(navigationTimeout);
        WebView previous = browser;
        if (previous.getParent() instanceof ViewGroup) ((ViewGroup) previous.getParent()).removeView(previous);
        previous.stopLoading(); previous.destroy();
        createBrowser(); changed();
    }
    public void start() {
        requestedStart = true;
        if (!ready || running || destroyed) return;
        try { server = new LoopbackServer(8787, apiKey, this); running = true; state = "桥已启动 · 127.0.0.1:8787"; }
        catch (IOException e) { state = "启动失败：8787 端口被占用"; }
        changed();
    }
    public void stop() {
        requestedStart = false; running = false;
        if (server != null) try { server.close(); } catch (IOException ignored) {}
        server = null;
        for (String id : new ArrayList<>(exchanges.keySet())) cancel(id);
        exchanges.clear();
        if (wakeLock.isHeld()) wakeLock.release();
        state = "桥已停止"; changed();
    }
    private void js(String source) { if (!destroyed && ready) engine.evaluateJavascript(source, null); }
    private void rpc(int id, boolean ok, Object value) {
        try { JSONObject response = new JSONObject().put("ok", ok); response.put(ok ? "value" : "error", value); js("AndroidEngine.rpc(" + id + "," + response + ")"); }
        catch (JSONException ignored) {}
    }
    private void fail(int id, String code, String message) {
        try { rpc(id, false, new JSONObject().put("code", code).put("message", message).put("status", 502)); }
        catch (JSONException ignored) {}
    }
    @Override public void dispatch(String id, String path, String body, LoopbackServer.Exchange exchange) {
        final JSONObject request;
        try {
            request = new JSONObject().put("id", id).put("path", path).put("body", body.isEmpty() ? new JSONObject() : new JSONObject(body));
        } catch (JSONException e) { exchange.response(400, "{\"error\":{\"code\":\"invalid_json\",\"message\":\"Body must be a JSON object.\"}}"); return; }
        exchanges.put(id, exchange);
        main.post(() -> {
            if (!ready || !running || destroyed) { exchanges.remove(id); exchange.response(503, "{\"error\":{\"code\":\"engine_unavailable\",\"message\":\"Open the Android bridge app.\"}}"); return; }
            if (path.equals("/v1/chat/completions")) { wakeLock.acquire(11 * 60 * 1000L); state = "桥运行中 · 正在处理请求"; changed(); }
            js("AndroidEngine.receive(" + request + ")");
        });
    }
    @Override public void cancel(String id) {
        exchanges.remove(id);
        main.post(() -> { js("AndroidEngine.cancel(" + JSONObject.quote(id) + ")"); if (exchanges.isEmpty() && wakeLock.isHeld()) wakeLock.release(); });
    }

    private void evaluate(int id, JSONObject argument) throws JSONException {
        if (!deepseek(browser.getUrl())) { fail(id, "UNEXPECTED_PAGE", "请在应用里打开 DeepSeek 登录。"); return; }
        String source = argument.getString("source");
        if (source.length() > 65536) { fail(id, "INVALID_SCRIPT", "页面操作脚本过大。"); return; }
        String token = "__dsh_android_" + UUID.randomUUID().toString().replace("-", "");
        String key = JSONObject.quote(token);
        Object args = argument.opt("argument");
        String argsJson = args == null ? "null" : args.toString();
        if (args instanceof String) argsJson = JSONObject.quote((String) args);
        String script = "(function(){var k=" + key + ";globalThis[k]={done:false};Promise.resolve().then(function(){if(location.origin!=='https://chat.deepseek.com')throw new Error('UNEXPECTED_PAGE');return (" + source + ")(" + argsJson + ");}).then(function(v){globalThis[k]={done:true,ok:true,value:v};},function(e){globalThis[k]={done:true,ok:false,error:{code:'PAGE_CHANGED',status:502,message:String(e.message||e)}};});return true;})()";
        final long deadline = SystemClock.elapsedRealtime() + 9000;
        final WebView target = browser;
        Runnable poll = new Runnable() {
            @Override public void run() {
                if (destroyed || target != browser) { evaluations.remove(id); fail(id, "REQUEST_CANCELLED", "页面已更换。"); return; }
                if (SystemClock.elapsedRealtime() >= deadline) { evaluations.remove(id); target.evaluateJavascript("delete globalThis[" + key + "]", null); fail(id, "android_webview_timeout", "网页脚本未在时限内完成。"); return; }
                target.evaluateJavascript("(function(){var v=globalThis[" + key + "];if(!v||!v.done)return null;delete globalThis[" + key + "];return JSON.stringify(v);})()", raw -> {
                    try {
                        Object decoded = new JSONTokener(raw).nextValue();
                        if (decoded == JSONObject.NULL) { main.postDelayed(this, 40); return; }
                        JSONObject response = new JSONObject((String) decoded);
                        evaluations.remove(id);
                        rpc(id, response.optBoolean("ok"), response.opt(response.optBoolean("ok") ? "value" : "error"));
                    } catch (Exception e) { evaluations.remove(id); fail(id, "PAGE_CHANGED", "无法读取网页操作结果。"); }
                });
            }
        };
        evaluations.put(id, poll);
        target.evaluateJavascript(script, ignored -> main.post(poll));
    }

    public final class NativeInterface {
        @JavascriptInterface public void ready() {
            main.post(() -> { if (!trustedEngine()) return; ready = true; state = "引擎就绪"; if (requestedStart) start(); changed(); });
        }
        @JavascriptInterface public void timer(int id, long delay) {
            main.post(() -> {
                if (!trustedEngine() || destroyed) return;
                Runnable old = timers.remove(id); if (old != null) main.removeCallbacks(old);
                Runnable task = () -> { timers.remove(id); js("AndroidEngine.timer(" + id + ")"); };
                timers.put(id, task); main.postDelayed(task, Math.max(0, Math.min(1800000, delay)));
            });
        }
        @JavascriptInterface public void clearTimer(int id) { main.post(() -> { Runnable task = timers.remove(id); if (task != null) main.removeCallbacks(task); }); }
        @JavascriptInterface public void request(int id, String operation, String raw) {
            main.post(() -> {
                if (!trustedEngine() || destroyed) return;
                try {
                    JSONObject argument = new JSONObject(raw);
                    if (operation.equals("evaluate")) evaluate(id, argument);
                    else if (operation.equals("navigate")) {
                        String url = argument.getString("url"); if (!deepseek(url)) { fail(id, "UNEXPECTED_PAGE", "只允许 DeepSeek 页面。"); return; }
                        if (navigationId != 0) fail(navigationId, "REQUEST_CANCELLED", "导航已替换。");
                        navigationId = id;
                        navigationTimeout = () -> { if (navigationId == id) { navigationId = 0; fail(id, "PAGE_UNAVAILABLE", "网页载入超时。"); } };
                        main.postDelayed(navigationTimeout, 30000); browser.loadUrl(url);
                    } else if (operation.equals("enter")) {
                        if (!deepseek(browser.getUrl())) { fail(id, "UNEXPECTED_PAGE", "网页来源不匹配。"); return; }
                        browser.requestFocus(); browser.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER)); browser.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER)); rpc(id, true, true);
                    } else if (operation.equals("resetBrowser")) { resetBrowser(); rpc(id, true, true); }
                    else if (operation.equals("showBrowser")) { changed(); rpc(id, true, true); }
                    else fail(id, "INVALID_OPERATION", "不支持的页面操作。");
                } catch (Exception e) { fail(id, "PAGE_CHANGED", "无法完成页面操作。"); }
            });
        }
        @JavascriptInterface public void response(String id, String kind, String raw) {
            LoopbackServer.Exchange exchange = exchanges.get(id); if (exchange == null) return;
            try {
                JSONObject payload = new JSONObject(raw);
                if (kind.equals("stream")) exchange.stream();
                else if (kind.equals("data")) exchange.data(payload.getString("text"));
                else if (kind.equals("response")) { exchange.response(payload.getInt("status"), payload.getJSONObject("body").toString()); exchanges.remove(id); }
                else if (kind.equals("end")) { exchange.end(); exchanges.remove(id); }
                main.post(() -> { if (exchanges.isEmpty()) { if (wakeLock.isHeld()) wakeLock.release(); state = running ? "桥运行中 · 等待请求" : "桥已停止"; changed(); } });
            } catch (JSONException e) { exchange.response(500, "{\"error\":{\"code\":\"native_transport_error\"}}"); exchanges.remove(id); }
        }
    }
    public void destroy() {
        stop(); destroyed = true;
        for (Runnable timer : timers.values()) main.removeCallbacks(timer); timers.clear();
        for (Runnable poll : evaluations.values()) main.removeCallbacks(poll); evaluations.clear();
        CookieManager.getInstance().flush(); browser.stopLoading(); browser.destroy(); engine.destroy();
    }
}
