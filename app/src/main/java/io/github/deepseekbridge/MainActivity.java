package io.github.deepseekbridge;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.os.*;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

/** Packaged UI and protocol engine share the trusted local WebView. The remote
 * browser is a separate native layer in the measured browser slot. */
public final class MainActivity extends Activity {
    private BridgeService service;
    private boolean bound;
    private FrameLayout root;
    private final ServiceConnection connection = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder binder) {
            service = ((BridgeService.LocalBinder) binder).service();
            service.runtime.attachContext(MainActivity.this);
            service.runtime.uiHost = (action, argument) -> handleAction(action, argument);
            service.runtime.onChange = () -> refresh();
            service.runtime.onLayout = () -> applyBrowserLayout();
            refresh();
        }
        @Override public void onServiceDisconnected(ComponentName name) { service = null; Toast.makeText(MainActivity.this, "服务已断开，请重新打开应用", Toast.LENGTH_LONG).show(); }
    };
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        root = new FrameLayout(this); root.setBackgroundColor(Color.rgb(245, 247, 251));
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                android.graphics.Insets keyboard = insets.getInsets(WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom));
            }
            return insets;
        });
        setContentView(root);
        int major = 0;
        try { major = Integer.parseInt(WebView.getCurrentWebViewPackage().versionName.split("\\.")[0]); } catch (Exception ignored) {}
        if (major < 120) {
            new AlertDialog.Builder(this).setTitle("请更新浏览器组件").setMessage("请更新 Android System WebView 或当前系统使用的 Chrome，再重新打开本应用。需要 Chromium 120 及以上。").setPositiveButton("关闭", (dialog, which) -> finish()).setCancelable(false).show(); return;
        }
        if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, 10);
        startForegroundService(new Intent(this, BridgeService.class));
        bound = bindService(new Intent(this, BridgeService.class), connection, BIND_AUTO_CREATE);
    }
    private void attach(View child) {
        if (child.getParent() == root) return;
        if (child.getParent() instanceof ViewGroup) ((ViewGroup) child.getParent()).removeView(child);
        root.addView(child, new FrameLayout.LayoutParams(-1, -1));
    }
    private void refresh() {
        if (service == null) return;
        attach(service.runtime.browser); attach(service.runtime.engine);
        service.runtime.publishUi(); applyTheme(service.runtime.uiDark); applyBrowserLayout();
    }
    private void applyTheme(boolean dark) {
        int colour = dark ? Color.rgb(16, 21, 31) : Color.rgb(245, 247, 251);
        root.setBackgroundColor(colour); getWindow().setStatusBarColor(colour); getWindow().setNavigationBarColor(colour);
        int flags = getWindow().getDecorView().getSystemUiVisibility();
        int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        getWindow().getDecorView().setSystemUiVisibility(dark ? flags & ~light : flags | light);
    }
    private void applyBrowserLayout() {
        if (service == null) return;
        BridgeRuntime runtime = service.runtime;
        JSONObject layout = runtime.uiLayout;
        boolean visible = layout.optBoolean("visible");
        if (!visible) {
            runtime.engine.bringToFront();
            if (runtime.browser.hasFocus()) {
                runtime.browser.clearFocus(); runtime.engine.requestFocus();
                ((InputMethodManager) getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(root.getWindowToken(), 0);
            }
            return;
        }
        double viewport = layout.optDouble("viewportWidth", 0);
        if (viewport <= 0 || runtime.engine.getWidth() <= 0) return;
        double scale = runtime.engine.getWidth() / viewport;
        int width = (int) Math.round(layout.optDouble("width") * scale), height = (int) Math.round(layout.optDouble("height") * scale);
        if (width < 1 || height < 1 || width > root.getWidth() * 2 || height > root.getHeight() * 2) return;
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(width, height);
        params.leftMargin = Math.max(0, (int) Math.round(layout.optDouble("left") * scale));
        params.topMargin = Math.max(0, (int) Math.round(layout.optDouble("top") * scale));
        runtime.browser.setLayoutParams(params); runtime.browser.bringToFront();
    }
    private void handleAction(String action, JSONObject argument) {
        if (service == null) return;
        if (action.equals("startupError")) {
            new AlertDialog.Builder(this).setTitle("界面初始化失败")
                .setMessage(argument.optString("message", "请重新载入界面。"))
                .setPositiveButton("重新载入", (dialog, which) -> { if (service != null) service.runtime.reloadUi(); })
                .setNegativeButton("关闭提示", null).show();
            return;
        }
        if (action.equals("theme")) { applyTheme(argument.optBoolean("dark")); return; }
        if (action.equals("search-policy")) { service.runtime.setWebSearchDefault(argument.optBoolean("enabled")); return; }
        if (action.equals("reset-conversations")) { service.runtime.resetConversations(); return; }
        if (action.equals("start")) startForegroundService(new Intent(this, BridgeService.class));
        else if (action.equals("stop")) service.stopBridge();
        else if (action.equals("inspect")) service.runtime.inspectPage();
        else if (action.equals("test")) probe(argument.optBoolean("thinking"));
        else if (action.equals("copy")) copy(argument.optString("field"));
    }
    private void copy(String field) {
        if (service == null) return;
        String text, label; boolean sensitive = false;
        if (field.equals("url")) { text = "http://127.0.0.1:8787/v1"; label = "API 地址"; }
        else if (field.equals("model")) { text = "deepseek-web"; label = "模型名称"; }
        else if (field.equals("key")) { text = service.runtime.apiKey; label = "API 密钥"; sensitive = true; }
        else if (field.equals("config")) {
            try { text = new JSONObject().put("base_url", "http://127.0.0.1:8787/v1").put("model", "deepseek-web").put("api_key", service.runtime.apiKey).toString(2); }
            catch (JSONException e) { return; }
            label = "连接配置"; sensitive = true;
        } else if (field.equals("claude")) {
            try {
                JSONObject env = new JSONObject().put("ANTHROPIC_BASE_URL", "http://127.0.0.1:8787").put("ANTHROPIC_AUTH_TOKEN", service.runtime.apiKey)
                    .put("ANTHROPIC_MODEL", "deepseek-web").put("ANTHROPIC_DEFAULT_SONNET_MODEL", "deepseek-web")
                    .put("ANTHROPIC_DEFAULT_OPUS_MODEL", "deepseek-web").put("ANTHROPIC_DEFAULT_HAIKU_MODEL", "deepseek-web")
                    .put("CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS", "1");
                text = new JSONObject().put("env", env).toString(2);
            } catch (JSONException e) { return; }
            label = "Claude Code 配置"; sensitive = true;
        } else if (field.equals("diagnostics")) {
            try { JSONObject data = service.runtime.snapshot(); data.remove("activities"); text = data.toString(2); }
            catch (JSONException e) { return; }
            label = "诊断信息";
        } else return;
        ClipData clip = ClipData.newPlainText("DeepSeek 本机桥 " + label, text);
        if (sensitive) { PersistableBundle extras = new PersistableBundle(); extras.putBoolean("android.content.extra.IS_SENSITIVE", true); clip.getDescription().setExtras(extras); }
        ((ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(clip);
        service.runtime.toast("已复制" + label);
    }
    private void probe(boolean thinking) {
        if (service == null) return;
        final BridgeRuntime runtime = service.runtime;
        if (!runtime.running) { runtime.toast("请先启动本机服务"); return; }
        try { if (runtime.snapshot().optBoolean("busy") || runtime.probeRunning) { runtime.toast("当前请求处理中，请稍后再试"); return; } }
        catch (JSONException e) { return; }
        runtime.beginProbe();
        final String marker = thinking ? "ANDROID_THINK_OK" : "ANDROID_BRIDGE_OK";
        new Thread(() -> {
            boolean passed = false; int reasoningChars = 0; String message;
            HttpURLConnection http = null;
            try {
                http = (HttpURLConnection) new URL("http://127.0.0.1:8787/v1/chat/completions").openConnection();
                http.setConnectTimeout(5000); http.setReadTimeout(610000); http.setRequestProperty("Authorization", "Bearer " + runtime.apiKey);
                http.setRequestMethod("POST"); http.setDoOutput(true); http.setRequestProperty("Content-Type", "application/json");
                JSONObject request = new JSONObject().put("model", "deepseek-web").put("stream", false).put("messages", new JSONArray().put(new JSONObject().put("role", "user").put("content", "只回复 " + marker)));
                request.put("web_search", false);
                if (thinking) request.put("thinking", new JSONObject().put("type", "enabled"));
                byte[] body = request.toString().getBytes(StandardCharsets.UTF_8);
                http.setFixedLengthStreamingMode(body.length); try (OutputStream out = http.getOutputStream()) { out.write(body); }
                int code = http.getResponseCode(); InputStream input = code >= 400 ? http.getErrorStream() : http.getInputStream();
                if (input == null) throw new IOException("接口没有返回可读取的结果");
                ByteArrayOutputStream bytes = new ByteArrayOutputStream(); byte[] buffer = new byte[8192];
                try (InputStream stream = input) { int count; while ((count = stream.read(buffer)) >= 0) { if (bytes.size() + count > 1024 * 1024) throw new IOException("测试结果超过读取上限"); bytes.write(buffer, 0, count); } }
                JSONObject result = new JSONObject(new String(bytes.toByteArray(), StandardCharsets.UTF_8));
                if (result.has("error")) message = result.getJSONObject("error").optString("message", "接口测试失败");
                else {
                    JSONObject answer = result.getJSONArray("choices").getJSONObject(0).getJSONObject("message");
                    reasoningChars = answer.optString("reasoning_content").length();
                    passed = marker.equals(answer.optString("content").trim()) && (!thinking || reasoningChars > 0);
                    message = passed ? thinking ? "思考开关已开启，真实网页返回了独立思考内容和正确测试回复。" : "真实 DeepSeek 网页调用通过，返回 ANDROID_BRIDGE_OK。"
                        : thinking && reasoningChars == 0 ? "网页已回复，但没有返回可读取的思考内容。请重新检测思考开关。" : "网页返回的测试内容不符合预期，请检查网页后重试。";
                }
            } catch (Exception error) { message = "测试未通过：" + (error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage()); }
            finally { if (http != null) http.disconnect(); }
            final boolean ok = passed; final int chars = reasoningChars; final String detail = message;
            new Handler(Looper.getMainLooper()).post(() -> runtime.finishProbe(thinking, ok, detail, chars));
        }, "bridge-local-probe").start();
    }
    @Override public void onBackPressed() {
        if (service == null || !service.runtime.ready) { super.onBackPressed(); return; }
        service.runtime.engine.evaluateJavascript("BridgeDashboard.back()", result -> { if (!"true".equals(result)) finish(); });
    }
    @Override protected void onResume() { super.onResume(); if (service != null) service.runtime.inspectPage(); }
    @Override protected void onDestroy() {
        if (service != null) {
            service.runtime.onChange = null; service.runtime.onLayout = null; service.runtime.uiHost = null; service.runtime.detachContext();
            if (service.runtime.browser.getParent() instanceof ViewGroup) ((ViewGroup) service.runtime.browser.getParent()).removeView(service.runtime.browser);
            if (service.runtime.engine.getParent() instanceof ViewGroup) ((ViewGroup) service.runtime.engine.getParent()).removeView(service.runtime.engine);
        }
        if (bound) unbindService(connection);
        super.onDestroy();
    }
}
