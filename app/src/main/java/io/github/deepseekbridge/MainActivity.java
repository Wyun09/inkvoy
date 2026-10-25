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
    private Boolean appliedDark;
    private String importProject, exportProject, exportPath, exportSessionId;
    private final ServiceConnection connection = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder binder) {
            service = ((BridgeService.LocalBinder) binder).service();
            if(service.runtime==null){showStartupFailure(service.startupFailure);service.stopBridge();return;}
            service.runtime.attachContext(MainActivity.this);
            service.runtime.resumeWebviews();
            service.runtime.uiHost = (action, argument) -> handleAction(action, argument);
            service.runtime.onChange = () -> refresh();
            service.runtime.onLayout = () -> applyBrowserLayout();
            refresh();
        }
        @Override public void onServiceDisconnected(ComponentName name) { service = null; Toast.makeText(MainActivity.this, "服务已断开，请重新打开应用", Toast.LENGTH_LONG).show(); }
    };
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if(state!=null){importProject=state.getString("importProject");exportProject=state.getString("exportProject");exportPath=state.getString("exportPath");exportSessionId=state.getString("exportSessionId");}
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        root = new FrameLayout(this); root.setBackgroundColor(Color.rgb(246, 245, 240));
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
        String previousFailure=CrashDiagnostics.read(this);
        if(!previousFailure.isEmpty()){showStartupFailure(previousFailure);return;}
        launchBridge();
    }
    private boolean available(){return service!=null&&service.runtime!=null;}
    private void launchBridge(){
        root.removeAllViews();
        int major = 0;
        try { major = Integer.parseInt(WebView.getCurrentWebViewPackage().versionName.split("\\.")[0]); } catch (Exception ignored) {}
        if (major < 120) {
            new AlertDialog.Builder(this).setTitle("请更新浏览器组件").setMessage("请更新 Android System WebView 或当前系统使用的 Chrome，再重新打开本应用。需要 Chromium 120 及以上。").setPositiveButton("关闭", (dialog, which) -> finish()).setCancelable(false).show(); return;
        }
        if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, 10);
        try{
            startForegroundService(new Intent(this, BridgeService.class));
            bound = bindService(new Intent(this, BridgeService.class), connection, BIND_AUTO_CREATE);
            if(!bound)showStartupFailure(CrashDiagnostics.record(this,"bind service",new IllegalStateException("无法绑定本机服务")));
        }catch(Throwable error){showStartupFailure(CrashDiagnostics.record(this,"launch service",error));}
    }
    private void showStartupFailure(String diagnostic){
        if(diagnostic==null||diagnostic.isEmpty())diagnostic="本机服务初始化失败，请复制诊断信息。";
        final String report=diagnostic;
        root.removeAllViews();
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);
        LinearLayout content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);
        int space=(int)(24*getResources().getDisplayMetrics().density);content.setPadding(space,space,space,space);scroll.addView(content);
        TextView title=new TextView(this);title.setText("启动遇到问题");title.setTextSize(24);title.setTextColor(Color.rgb(32,69,55));content.addView(title);
        TextView help=new TextView(this);help.setText("启动错误已保存在本机。可以复制诊断或重试，原有聊天、登录和项目文件均保留。");help.setTextSize(16);help.setPadding(0,space,0,space);content.addView(help);
        Button retry=new Button(this);retry.setText("重试启动");retry.setOnClickListener(v->{
            if(available()){service.runtime.onChange=null;service.runtime.onLayout=null;service.runtime.uiHost=null;service.runtime.detachContext();}
            if(bound){unbindService(connection);bound=false;}service=null;stopService(new Intent(this,BridgeService.class));
            CrashDiagnostics.clear(this);launchBridge();
        });content.addView(retry);
        Button copy=new Button(this);copy.setText("复制诊断");copy.setOnClickListener(v->{((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("DeepSeek 启动诊断",report));Toast.makeText(this,"诊断已复制",Toast.LENGTH_SHORT).show();});content.addView(copy);
        TextView trace=new TextView(this);trace.setText(report);trace.setTextSize(12);trace.setTextIsSelectable(true);trace.setPadding(0,space,0,space);content.addView(trace);
        root.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
    }
    private void attach(View child) {
        if (child.getParent() == root) return;
        if (child.getParent() instanceof ViewGroup) ((ViewGroup) child.getParent()).removeView(child);
        root.addView(child, new FrameLayout.LayoutParams(-1, -1));
    }
    private void refresh() {
        if (!available()) return;
        attach(service.runtime.browser); attach(service.runtime.engine);
        service.runtime.publishUi(); applyTheme(service.runtime.uiDark); applyBrowserLayout();
    }
    private void applyTheme(boolean dark) {
        if (appliedDark != null && appliedDark == dark) return;
        appliedDark = dark;
        int colour = dark ? Color.rgb(20, 30, 26) : Color.rgb(246, 245, 240);
        root.setBackgroundColor(colour); getWindow().setStatusBarColor(colour); getWindow().setNavigationBarColor(colour);
        int flags = getWindow().getDecorView().getSystemUiVisibility();
        int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        getWindow().getDecorView().setSystemUiVisibility(dark ? flags & ~light : flags | light);
    }
    private void applyBrowserLayout() {
        if (!available()) return;
        BridgeRuntime runtime = service.runtime;
        JSONObject layout = runtime.uiLayout;
        boolean visible = layout.optBoolean("visible");
        if (!visible) {
            if (root.getChildAt(root.getChildCount() - 1) != runtime.engine) runtime.engine.bringToFront();
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
        FrameLayout.LayoutParams previous = (FrameLayout.LayoutParams) runtime.browser.getLayoutParams();
        if (previous.width != params.width || previous.height != params.height || previous.leftMargin != params.leftMargin || previous.topMargin != params.topMargin) runtime.browser.setLayoutParams(params);
        if (root.getChildAt(root.getChildCount() - 1) != runtime.browser) runtime.browser.bringToFront();
    }
    private void handleAction(String action, JSONObject argument) {
        if (!available()) return;
        if(action.equals("permission-files")||action.equals("permission-battery")||action.equals("permission-notifications")||action.equals("permission-app-settings")){AccessSettings.request(this,action);return;}
        if (action.equals("startupError")) {
            new AlertDialog.Builder(this).setTitle("界面初始化失败")
                .setMessage(argument.optString("message", "请重新载入界面。"))
                .setPositiveButton("重新载入", (dialog, which) -> { if (available()) service.runtime.reloadUi(); })
                .setNegativeButton("关闭提示", null).show();
            return;
        }
        if (action.equals("theme")) { applyTheme(argument.optBoolean("dark")); return; }
        if (action.equals("terminal-keyboard")) {
            service.runtime.engine.requestFocus();
            ((InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).showSoftInput(service.runtime.engine,InputMethodManager.SHOW_IMPLICIT);return;
        }
        if (action.equals("paste-terminal")) {
            ClipboardManager clipboard=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
            if(clipboard.hasPrimaryClip()&&clipboard.getPrimaryClip()!=null){CharSequence value=clipboard.getPrimaryClip().getItemAt(0).coerceToText(this);if(value!=null)try{JSONObject event=new JSONObject().put("type","clipboard").put("text",value.toString().substring(0,Math.min(65536,value.length())));service.runtime.engine.evaluateJavascript("AndroidEngine.nativeEvent("+event+")",null);}catch(JSONException ignored){}}
            return;
        }
        if (action.equals("import-file")) {
            importProject=argument.optString("project");
            Intent picker=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE);
            try{startActivityForResult(picker,21);}catch(ActivityNotFoundException e){service.runtime.toast("系统文件选择器不可用");}return;
        }
        if (action.equals("export-file")) {
            exportSessionId=null;
            exportProject=argument.optString("project");exportPath=argument.optString("path");
            Intent picker=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/octet-stream").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,new File(exportPath).getName());
            try{startActivityForResult(picker,22);}catch(ActivityNotFoundException e){service.runtime.toast("系统文件导出不可用");}return;
        }
        if(action.equals("export-chat")){
            exportSessionId=argument.optString("id");exportPath=null;exportProject=null;
            Intent picker=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,"deepseek-session.json");
            try{startActivityForResult(picker,22);}catch(ActivityNotFoundException e){service.runtime.toast("系统文件导出不可用");}return;
        }
        if (action.equals("open-link")) {
            String value=argument.optString("url");android.net.Uri url=android.net.Uri.parse(value);
            if(value.length()>4096||!("https".equalsIgnoreCase(url.getScheme())||"http".equalsIgnoreCase(url.getScheme()))||url.getHost()==null){service.runtime.toast("此链接无法打开");return;}
            try{startActivity(new Intent(Intent.ACTION_VIEW,url).addCategory(Intent.CATEGORY_BROWSABLE));}catch(ActivityNotFoundException e){service.runtime.toast("没有可用的浏览器");}return;
        }
        if (action.equals("copy-text")) {
            String text=argument.optString("text");if(text.length()>2097152){service.runtime.toast("复制内容超过限制");return;}
            ((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("DeepSeek Studio",text));service.runtime.toast("已复制");return;
        }
        if (action.equals("search-policy")) { service.runtime.setWebSearchDefault(argument.optBoolean("enabled")); return; }
        if (action.equals("reset-conversations")) { service.runtime.resetConversations(); return; }
        if (action.equals("agent-policy")) { service.runtime.setAgentStrict(argument.optBoolean("enabled", true)); return; }
        if (action.equals("task-cancel") || action.equals("task-retry") || action.equals("session-open") || action.equals("session-forget") || action.equals("task-result")) { service.runtime.taskAction(action, argument.optString("id")); return; }
        if (action.equals("start")) startForegroundService(new Intent(this, BridgeService.class));
        else if (action.equals("stop")) service.stopBridge();
        else if (action.equals("inspect")) service.runtime.inspectPage();
        else if (action.equals("test")) probe(argument.optBoolean("thinking"));
        else if (action.equals("copy")) copy(argument.optString("field"));
    }
    private void copy(String field) {
        if (!available()) return;
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
            try { text = service.runtime.diagnostics().toString(2); }
            catch (JSONException e) { return; }
            label = "诊断信息";
        } else return;
        ClipData clip = ClipData.newPlainText("DeepSeek 本机桥 " + label, text);
        if (sensitive) { PersistableBundle extras = new PersistableBundle(); extras.putBoolean("android.content.extra.IS_SENSITIVE", true); clip.getDescription().setExtras(extras); }
        ((ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(clip);
        service.runtime.toast("已复制" + label);
    }
    private void probe(boolean thinking) {
        if (!available()) return;
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
        if (!available() || !service.runtime.ready) { super.onBackPressed(); return; }
        service.runtime.engine.evaluateJavascript("BridgeDashboard.back()", result -> { if (!"true".equals(result)) finish(); });
    }
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);state.putString("importProject",importProject);state.putString("exportProject",exportProject);state.putString("exportPath",exportPath);state.putString("exportSessionId",exportSessionId);}
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null||data.getData()==null||!available())return;
        if(request==21&&importProject!=null)service.runtime.studio.importFile(data.getData(),importProject);
        if(request==22&&exportSessionId!=null)service.runtime.exportClientSession(data.getData(),exportSessionId);
        else if(request==22&&exportProject!=null&&exportPath!=null)service.runtime.studio.exportFile(data.getData(),exportProject,exportPath);
    }
    @Override protected void onResume() { super.onResume(); if (available()) {service.runtime.resumeWebviews();service.runtime.refreshPermissions();service.runtime.publishUi();service.runtime.inspectPage();} }
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(available())service.runtime.refreshPermissions();}
    @Override protected void onDestroy() {
        if (available()) {
            service.runtime.onChange = null; service.runtime.onLayout = null; service.runtime.uiHost = null; service.runtime.detachContext();
            if (service.runtime.browser.getParent() instanceof ViewGroup) ((ViewGroup) service.runtime.browser.getParent()).removeView(service.runtime.browser);
            if (service.runtime.engine.getParent() instanceof ViewGroup) ((ViewGroup) service.runtime.engine.getParent()).removeView(service.runtime.engine);
        }
        if (bound) unbindService(connection);
        super.onDestroy();
    }
}
