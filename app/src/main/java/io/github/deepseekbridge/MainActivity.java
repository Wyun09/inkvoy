package io.github.deepseekbridge;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.os.*;
import android.view.*;
import android.widget.*;
import android.webkit.WebView;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private BridgeService service;
    private boolean bound;
    private LinearLayout root, pages;
    private TextView status;
    private final ServiceConnection connection = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder binder) {
            service = ((BridgeService.LocalBinder) binder).service(); service.runtime.attachContext(MainActivity.this);
            service.runtime.onChange = () -> refresh(); refresh();
        }
        @Override public void onServiceDisconnected(ComponentName name) { service = null; status.setText("服务已断开，请重新打开应用"); }
    };
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.WHITE);
        root.setPadding(dp(14), dp(10), dp(14), 0);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(dp(14), insets.getSystemWindowInsetTop() + dp(8), dp(14), insets.getSystemWindowInsetBottom()); return insets;
        });
        TextView title = new TextView(this); title.setText("DeepSeek 本机桥"); title.setTextSize(21); title.setTextColor(Color.rgb(33, 59, 105)); root.addView(title);
        status = new TextView(this); status.setText("准备运行环境…"); status.setTextSize(14); status.setPadding(0, dp(6), 0, dp(6)); root.addView(status);
        TextView address = new TextView(this); address.setText("http://127.0.0.1:8787/v1  ·  deepseek-web"); address.setTextIsSelectable(true); address.setTextSize(13); root.addView(address);
        LinearLayout controls = new LinearLayout(this);
        button(controls, "启动桥", () -> { startForegroundService(new Intent(this, BridgeService.class)); });
        button(controls, "停止桥", () -> { if (service != null) service.stopBridge(); });
        button(controls, "复制密钥", () -> {
            if (service == null) return;
            ClipData clip = ClipData.newPlainText("DeepSeek 本机桥 API Key", service.runtime.apiKey);
            PersistableBundle sensitive = new PersistableBundle(); sensitive.putBoolean("android.content.extra.IS_SENSITIVE", true); clip.getDescription().setExtras(sensitive);
            ((ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(clip);
            Toast.makeText(this, "已复制本机 API 密钥", Toast.LENGTH_SHORT).show();
        }); root.addView(controls);
        LinearLayout checks = new LinearLayout(this);
        button(checks, "检查登录", () -> probe(false));
        button(checks, "测试接口", () -> probe(true));
        button(checks, "使用说明", () -> new AlertDialog.Builder(this).setTitle("手机独立使用")
            .setMessage("1. 在下方网页登录 DeepSeek；验证码和人机验证由你手动完成。\n\n2. 点“检查登录”和“测试接口”。\n\n3. 在手机兼容客户端填写上方地址，模型 deepseek-web，密钥用“复制密钥”。\n\n电脑可以关机。先用分屏保持本应用可见；切后台与锁屏后的可靠性取决于系统和 WebView，当前版本仍需真机验收。\n\n每个手机请求按顺序处理。API 不会替客户端执行工具；客户端要有对应工具能力。\n\n这是第三方适配项目，不是 DeepSeek 官方应用。")
            .setPositiveButton("知道了", null).show()); root.addView(checks);
        pages = new LinearLayout(this); pages.setOrientation(LinearLayout.VERTICAL); root.addView(pages, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
        int webViewMajor = 0;
        try { webViewMajor = Integer.parseInt(WebView.getCurrentWebViewPackage().versionName.split("\\.")[0]); } catch (Exception ignored) {}
        if (webViewMajor < 120) {
            status.setText("需要更新系统 WebView / Chrome（120 及以上）");
            new AlertDialog.Builder(this).setTitle("浏览器组件版本过低").setMessage("请在手机应用商店更新 Android System WebView 或当前系统使用的 Chrome，再重新打开本应用。需要 Chromium 120 及以上。").setPositiveButton("关闭", (dialog, which) -> finish()).setCancelable(false).show();
            return;
        }
        if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, 10);
        startForegroundService(new Intent(this, BridgeService.class));
        bound = bindService(new Intent(this, BridgeService.class), connection, BIND_AUTO_CREATE);
    }
    private void button(LinearLayout row, String text, Runnable callback) {
        Button button = new Button(this); button.setText(text); button.setTextSize(13); button.setMinHeight(dp(44));
        button.setContentDescription(text); button.setOnClickListener(view -> callback.run());
        row.addView(button, new LinearLayout.LayoutParams(0, -2, 1));
    }
    private void attach(View view, LinearLayout parent, LinearLayout.LayoutParams params) {
        if (view.getParent() == parent) return;
        if (view.getParent() instanceof ViewGroup) ((ViewGroup) view.getParent()).removeView(view);
        parent.addView(view, params);
    }
    private void refresh() {
        if (service == null) return;
        status.setText(service.runtime.state);
        attach(service.runtime.browser, pages, new LinearLayout.LayoutParams(-1, 0, 1));
        attach(service.runtime.engine, pages, new LinearLayout.LayoutParams(1, 1));
    }
    private void probe(boolean completion) {
        if (service == null || !service.runtime.running) { Toast.makeText(this, "请先启动桥", Toast.LENGTH_SHORT).show(); return; }
        final String key = service.runtime.apiKey;
        Toast.makeText(this, completion ? "正在测试真实网页调用…" : "正在检查…", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            String message;
            HttpURLConnection http = null;
            try {
                http = (HttpURLConnection) new URL("http://127.0.0.1:8787" + (completion ? "/v1/chat/completions" : "/browser/status")).openConnection();
                http.setConnectTimeout(5000); http.setReadTimeout(completion ? 270000 : 15000); http.setRequestProperty("Authorization", "Bearer " + key);
                if (completion) {
                    http.setRequestMethod("POST"); http.setDoOutput(true); http.setRequestProperty("Content-Type", "application/json");
                    byte[] body = "{\"model\":\"deepseek-web\",\"messages\":[{\"role\":\"user\",\"content\":\"只回复 ANDROID_BRIDGE_OK\"}],\"stream\":false}".getBytes(StandardCharsets.UTF_8);
                    http.setFixedLengthStreamingMode(body.length); try (OutputStream out = http.getOutputStream()) { out.write(body); }
                }
                int code = http.getResponseCode(); InputStream input = code >= 400 ? http.getErrorStream() : http.getInputStream();
                ByteArrayOutputStream bytes = new ByteArrayOutputStream(); byte[] buffer = new byte[8192];
                try (InputStream stream = input) { int count; while ((count = stream.read(buffer)) >= 0) { if (bytes.size() + count > 1024 * 1024) throw new IOException("结果过大"); bytes.write(buffer, 0, count); } }
                JSONObject result = new JSONObject(new String(bytes.toByteArray(), StandardCharsets.UTF_8));
                if (result.has("error")) message = result.getJSONObject("error").optString("message", "接口失败");
                else if (!completion) message = result.optBoolean("loggedIn") ? "DeepSeek 登录有效，网页可用。" : result.optString("message", "请先在下方网页登录 DeepSeek。");
                else {
                    String answer = result.getJSONArray("choices").getJSONObject(0).getJSONObject("message").optString("content");
                    message = "ANDROID_BRIDGE_OK".equals(answer.trim()) ? "真实网页调用通过：ANDROID_BRIDGE_OK" : "网页已返回：\n" + answer;
                }
            } catch (Exception error) { message = "测试未通过：" + (error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage()); }
            finally { if (http != null) http.disconnect(); }
            final String text = message;
            runOnUiThread(() -> { if (!isFinishing() && !isDestroyed()) new AlertDialog.Builder(this).setTitle(completion ? "接口测试" : "登录状态").setMessage(text).setPositiveButton("确定", null).show(); });
        }, "bridge-local-probe").start();
    }
    @Override protected void onDestroy() {
        if (service != null) {
            service.runtime.onChange = null; service.runtime.detachContext();
            if (service.runtime.browser.getParent() instanceof ViewGroup) ((ViewGroup) service.runtime.browser.getParent()).removeView(service.runtime.browser);
            if (service.runtime.engine.getParent() instanceof ViewGroup) ((ViewGroup) service.runtime.engine.getParent()).removeView(service.runtime.engine);
        }
        if (bound) unbindService(connection);
        super.onDestroy();
    }
}
