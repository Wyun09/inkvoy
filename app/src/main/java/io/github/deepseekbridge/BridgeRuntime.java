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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.text.SimpleDateFormat;

/** The local trusted engine and the remote page live in separate WebViews.
 * Only packaged, non-navigable assets have a native JavascriptInterface. */
public final class BridgeRuntime implements LoopbackServer.Dispatcher {
    private final Context context;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService stateWriter = Executors.newSingleThreadExecutor(r -> new Thread(r, "studio-state-writer"));
    private volatile JSONObject permissions = new JSONObject();
    private boolean changeScheduled;
    private final MutableContextWrapper browserContext;
    public WebView browser;
    public WebView engine;
    public final ComputerBrowser computer;
    private final Map<String, LoopbackServer.Exchange> exchanges = new ConcurrentHashMap<>();
    private final Map<Integer, Runnable> timers = new HashMap<>();
    private final Map<Integer, Runnable> evaluations = new HashMap<>();
    private final PowerManager.WakeLock wakeLock;
    public Runnable onChange;
    public Runnable onLayout;
    public interface UiHost { void action(String action, JSONObject argument); }
    public UiHost uiHost;
    public JSONObject uiLayout = new JSONObject();
    public boolean uiDark, hasInspection, loggedIn, needsVerification, inspecting, probeRunning;
    public String testStatus = "untested", lastError = "";
    private JSONObject reasoningMode = new JSONObject();
    private JSONObject webSearchMode = new JSONObject();
    private JSONObject conversations = new JSONObject();
    private JSONObject taskboard = new JSONObject();
    private final LocalState localState;
    private final LocalState clientState;
    private final LocalState providerState;
    private final ProviderGateway providers = new ProviderGateway();
    public final StudioRuntime studio;
    public volatile boolean agentStrict;
    public volatile boolean webSearchDefault;
    private final List<JSONObject> activities = new ArrayList<>();
    private final Set<String> completions = Collections.newSetFromMap(new ConcurrentHashMap<String, Boolean>());
    private int requests;
    private int studioWork;
    private long lastInspection;
    public String state = "准备中";
    public boolean ready, running;
    private boolean requestedStart;
    private volatile boolean destroyed;
    private volatile int engineEpoch;
    private int engineCrashes, browserCrashes;
    private long crashWindow;
    private boolean recoveryBlocked;
    private LoopbackServer server;
    private int navigationId;
    private Runnable navigationTimeout;
    public final String apiKey;

    public BridgeRuntime(Context context) {
        this.context = context;
        SharedPreferences prefs = context.getSharedPreferences("local-bridge", Context.MODE_PRIVATE);
        localState = new LocalState(context); agentStrict = prefs.getBoolean("agent-strict", true);
        clientState = new LocalState(context,"studio-client-state-v2","deepseek-studio-client-v2");
        providerState = new LocalState(context,"studio-providers-v1","deepseek-studio-providers-v1");
        webSearchDefault = prefs.getBoolean("web-search-default", true);
        String key = prefs.getString("key", null);
        if (key == null) { key = "android-" + UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""); prefs.edit().putString("key", key).apply(); }
        apiKey = key;
        PowerManager power = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "deepseek-bridge:request");
        wakeLock.setReferenceCounted(false);
        studio = new StudioRuntime(context, value -> main.post(() -> {
            if(destroyed)return;
            if("work".equals(value.optString("type"))){studioWork=value.optInt("value");if(studioWork>0&&!wakeLock.isHeld())wakeLock.acquire(11*60*1000L);else if(studioWork==0&&completions.isEmpty()&&taskboard.optInt("active")==0&&wakeLock.isHeld())wakeLock.release();}
            else if (ready) js("AndroidEngine.nativeEvent(" + value + ")");
        }));
        browserContext = new MutableContextWrapper(context);
        computer = new ComputerBrowser(context,new ComputerBrowser.Listener(){
            public void changed(JSONObject value){if(ready)js("AndroidEngine.nativeEvent("+newEvent("computer",value)+")");if(onLayout!=null)onLayout.run();}
            public void reveal(){if(ready)js("AndroidEngine.computerOpen()");}
        });
        studio.browserTool=new StudioRuntime.BrowserTool(){public JSONObject run(String id,JSONObject args)throws Exception{return computer.tool(id,args);}public void cancel(){main.post(()->computer.cancel());}};
        refreshPermissions();
        createBrowser();
        createEngine();
    }
    private void createEngine() {
        engineEpoch++;
        engine = new WebView(context);
        keepRenderer(engine);
        engine.getSettings().setJavaScriptEnabled(true);
        engine.getSettings().setDomStorageEnabled(true);
        engine.getSettings().setUseWideViewPort(true);
        engine.getSettings().setAllowFileAccess(false);
        engine.getSettings().setAllowContentAccess(false);
        engine.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        engine.addJavascriptInterface(new NativeInterface(), "NativeBridge");
        engine.setWebViewClient(new WebViewClient() {
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                if (view == engine) {
                    ready = false; studio.detachTerminals();
                    for (LoopbackServer.Exchange exchange : new ArrayList<>(exchanges.values())) exchange.abort("{\"type\":\"error\",\"error\":{\"type\":\"api_error\",\"code\":\"engine_restarted\",\"message\":\"The Android engine exited. Check the task record before retrying.\"}}");
                    exchanges.clear(); completions.clear();
                    if (studioWork==0&&wakeLock.isHeld()) wakeLock.release();
                    int attempt = recordCrash(true);
                    main.postDelayed(() -> resetEngine(view), attempt > 3 ? 0 : Math.min(8000,1000L << (attempt-1)));
                }
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (!trustedEngine()) return;
                main.postDelayed(() -> {
                    if (!destroyed && !ready) reportStartupError("界面未完成初始化，请重新载入。若问题重复，请保留此提示文字。");
                }, 10000);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !"bridge.local".equals(uri.getHost())) return blocked();
                String asset;
                if ("/engine.html".equals(uri.getPath())) asset = "engine.html";
                else if ("/engine.bundle.js".equals(uri.getPath())) asset = "engine.bundle.js";
                else if ("/app.css".equals(uri.getPath())) asset = "app.css";
                else if ("/logo.png".equals(uri.getPath())) asset = "logo.png";
                else if ("/companion.png".equals(uri.getPath())) asset = "companion.png";
                else if(uri.getPath()!=null&&uri.getPath().matches("/chat-media/[a-f0-9]{64}")){
                    try{return new WebResourceResponse("image/jpeg",null,new FileInputStream(studio.media.file(uri.getLastPathSegment())));}catch(IOException e){return blocked();}
                }else if(uri.getPath()!=null&&uri.getPath().matches("/browser-capture/[a-f0-9-]{36}\\.jpg")){
                    try{return new WebResourceResponse("image/jpeg",null,new FileInputStream(computer.captureFile(uri.getLastPathSegment().replace(".jpg","")))) ;}catch(IOException e){return blocked();}
                }else return blocked();
                try { return new WebResourceResponse(asset.endsWith(".png") ? "image/png" : asset.endsWith(".js") ? "application/javascript" : asset.endsWith(".css") ? "text/css" : "text/html", asset.endsWith(".png") ? null : "UTF-8", context.getAssets().open(asset)); }
                catch (IOException e) { return blocked(); }
            }
        });
        if (!recoveryBlocked) engine.loadUrl("https://bridge.local/engine.html");
        else main.post(() -> reportStartupError("界面连续退出 3 次，自动恢复已暂停。更新系统 WebView 后可手动重新载入。"));
    }
    private void resetEngine(WebView previous) {
        if (destroyed || engine != previous) return;
        providers.cancelAll();
        for (Runnable timer : timers.values()) main.removeCallbacks(timer); timers.clear();
        for (Runnable poll : evaluations.values()) main.removeCallbacks(poll); evaluations.clear();
        if (navigationTimeout != null) main.removeCallbacks(navigationTimeout);
        navigationId = 0; inspecting = false; probeRunning = false; taskboard = new JSONObject();
        if (previous.getParent() instanceof ViewGroup) ((ViewGroup) previous.getParent()).removeView(previous);
        previous.destroy(); startupErrorReported = false;
        lastError = "界面引擎已恢复，上次请求不会自动重新发送，请查看任务记录。";
        event("界面引擎中断，正在恢复本机记录"); createEngine(); changed();
    }
    private static WebResourceResponse blocked() { return new WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", Collections.emptyMap(), new ByteArrayInputStream(new byte[0])); }
    private boolean startupErrorReported;
    private void reportStartupError(String message) {
        if (startupErrorReported || destroyed) return;
        startupErrorReported = true; lastError = message;
        if (uiHost != null) try { uiHost.action("startupError", new JSONObject().put("message", message)); } catch (JSONException ignored) {}
    }
    private int recordCrash(boolean local) {long now=SystemClock.elapsedRealtime();if(now-crashWindow>120000){engineCrashes=browserCrashes=0;crashWindow=now;}int count=local?++engineCrashes:++browserCrashes;if(local&&count>3)recoveryBlocked=true;return count;}
    public void reloadUi() { if (!ready && !destroyed) { startupErrorReported = false; recoveryBlocked=false;engineCrashes=0; engine.loadUrl("https://bridge.local/engine.html"); } }
    private boolean trustedEngine() { return !destroyed && engine != null && "https://bridge.local/engine.html".equals(engine.getUrl()); }
    private static boolean deepseek(String url) { if (url == null) return false; Uri uri = Uri.parse(url); return "https".equals(uri.getScheme()) && "chat.deepseek.com".equals(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443); }
    private void changed() {
        if (changeScheduled || destroyed) return;
        changeScheduled = true;
        main.postDelayed(() -> { changeScheduled = false; if (!destroyed && onChange != null) onChange.run(); }, 16);
    }
    public void refreshPermissions() {
        if (destroyed) return;
        stateWriter.execute(() -> { try { JSONObject result = AccessSettings.status(context); main.post(() -> { if (!destroyed) { permissions = result; changed(); } }); } catch (JSONException ignored) {} });
    }
    private static JSONObject newEvent(String type,JSONObject value){JSONObject event=new JSONObject();try{event.put("type",type).put("value",value);}catch(JSONException ignored){}return event;}
    public void attachContext(Context activity) { browserContext.setBaseContext(activity);computer.attach(activity); }
    public void detachContext() { browserContext.setBaseContext(context);computer.detach(); }
    static void keepRenderer(WebView view){view.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT,false);view.getSettings().setOffscreenPreRaster(true);}
    public void resumeWebviews(){if(destroyed)return;browser.onResume();engine.onResume();}
    public void publishUi() { try { js("BridgeDashboard.render(" + snapshot() + ")"); } catch (JSONException ignored) {} }
    public JSONObject snapshot() throws JSONException {
        return new JSONObject().put("version", "2.4.0").put("ready", ready).put("running", running)
            .put("loggedIn", loggedIn).put("hasInspection", hasInspection).put("needsVerification", needsVerification)
            .put("inspecting", inspecting).put("reasoningMode", reasoningMode).put("busy", !completions.isEmpty() || taskboard.optInt("active") > 0)
            .put("webSearchMode", webSearchMode).put("webSearchDefault", webSearchDefault)
            .put("conversations", conversations).put("orientation",DisplayMode.get(context))
            .put("taskboard", taskboard).put("storage", new JSONObject(localState.status())).put("agentStrict", agentStrict).put("permissions",permissions)
            .put("probeRunning", probeRunning).put("testStatus", testStatus).put("requests", requests)
            .put("lastError", lastError).put("activities", new JSONArray(activities));
    }
    public void inspectPage() {
        if (!ready || destroyed || inspecting || System.currentTimeMillis() - lastInspection < 1000) return;
        inspecting = true; lastInspection = System.currentTimeMillis(); changed();
        js("AndroidEngine.inspect()");
    }
    public void resetConversations() {
        if (!ready || !completions.isEmpty() || taskboard.optInt("active") > 0 || probeRunning) { toast("当前请求处理中，请完成后再开始新会话"); return; }
        js("AndroidEngine.resetConversations()");
    }
    public JSONObject diagnostics() throws JSONException {
        return new JSONObject().put("version", "2.4.0").put("running", running).put("ready", ready).put("loggedIn", loggedIn)
            .put("storage", new JSONObject(localState.status())).put("agentStrict", agentStrict)
            .put("requests", taskboard.optInt("totalRequests")).put("active", taskboard.optInt("active"))
            .put("trackedSessions", conversations.optInt("tracked")).put("reused", conversations.optInt("reused"));
    }
    public void setAgentStrict(boolean enabled) {
        agentStrict = enabled; context.getSharedPreferences("local-bridge", Context.MODE_PRIVATE).edit().putBoolean("agent-strict", enabled).apply();
        toast(enabled ? "严格结束协议已开启" : "兼容模式已开启"); changed();
    }
    public void taskAction(String action, String id) {
        if (!ready) return;
        js("AndroidEngine.taskAction(" + JSONObject.quote(action) + "," + JSONObject.quote(id) + ")");
    }
    public void event(String text) {
        try { activities.add(new JSONObject().put("text", text).put("time", new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date()))); }
        catch (JSONException ignored) {}
        while (activities.size() > 12) activities.remove(0);
    }
    public void beginProbe() { probeRunning = true; event("开始真实网页接口测试"); changed(); }
    public void finishProbe(boolean thinking, boolean passed, String message, int reasoningChars) {
        probeRunning = false; testStatus = passed ? "passed" : "failed";
        if (!passed) lastError = message;
        event((thinking ? "思考模式测试" : "接口自测") + (passed ? "通过" : "未通过")); changed();
        try { js("BridgeDashboard.result(" + new JSONObject().put("thinking", thinking).put("passed", passed).put("message", message).put("reasoningChars", reasoningChars) + ")"); } catch (JSONException ignored) {}
        main.postDelayed(() -> inspectPage(), 350);
    }
    public void toast(String message) { js("BridgeDashboard.toast(" + JSONObject.quote(message) + ")"); }
    public void exportClientSession(Uri uri,String id){new Thread(()->{
        String message="会话已导出";
        try{JSONArray sessions=new JSONObject(clientState.load()).optJSONArray("sessions");JSONObject selected=null;if(sessions!=null)for(int i=0;i<sessions.length();i++){JSONObject s=sessions.optJSONObject(i);if(s!=null&&id.equals(s.optString("id"))){selected=s;break;}}
            if(selected==null)throw new IOException("会话记录未找到或无法读取");
            try(OutputStream out=context.getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException("无法写入导出目标");out.write(selected.toString(2).getBytes(java.nio.charset.StandardCharsets.UTF_8));}
        }catch(Exception e){message="导出失败："+e.getMessage();}final String result=message;main.post(()->toast(result));
    },"studio-chat-export").start();}
    public void setWebSearchDefault(boolean enabled) {
        webSearchDefault = enabled;
        context.getSharedPreferences("local-bridge", Context.MODE_PRIVATE).edit().putBoolean("web-search-default", enabled).apply();
        event(enabled ? "默认启用网页智能搜索" : "默认关闭网页智能搜索"); changed();
        toast(enabled ? "下次请求默认开启网页智能搜索" : "下次请求默认关闭网页智能搜索");
    }

    private void createBrowser() { createBrowser(true); }
    private void createBrowser(boolean load) {
        browser = new WebView(browserContext);
        keepRenderer(browser);
        // Keep JavaScript alive without rasterizing an obscured remote webpage.
        browser.getSettings().setOffscreenPreRaster(false);
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
                if (view != browser || !Objects.equals(view.getUrl(), url)) return;
                if (navigationId != 0) {
                    int id = navigationId; navigationId = 0;
                    if (navigationTimeout != null) main.removeCallbacks(navigationTimeout);
                    if (deepseek(url)) rpc(id, true, JSONObject.NULL); else fail(id, "UNEXPECTED_PAGE", "网页离开了 DeepSeek。");
                }
                state = running ? "桥运行中 · 网页已载入" : "网页已载入"; changed();
                if (completions.isEmpty()) main.postDelayed(() -> inspectPage(), 700);
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                if (view != browser) return true;
                for (String id : new ArrayList<>(exchanges.keySet())) cancel(id);
                js("AndroidEngine.cancelAll()");
                int attempt=recordCrash(false);
                if(attempt<=3)main.postDelayed(() -> {if(!destroyed&&view==browser)resetBrowser();},Math.min(8000,1000L << (attempt-1)));
                else {main.post(()->{if(!destroyed&&view==browser){resetBrowser(false);lastError="DeepSeek 网页连续退出，已暂停自动恢复。请更新 WebView 后在连接页手动重新载入网页。";changed();}});}
                return true;
            }
        });
        if(load)browser.loadUrl("https://chat.deepseek.com/");
    }
    private void resetBrowser() { resetBrowser(true); }
    private void resetBrowser(boolean load) {
        for (Map.Entry<Integer, Runnable> entry : new ArrayList<>(evaluations.entrySet())) {
            main.removeCallbacks(entry.getValue()); fail(entry.getKey(), "REQUEST_CANCELLED", "旧网页已清理。");
        }
        evaluations.clear();
        if (navigationId != 0) { fail(navigationId, "REQUEST_CANCELLED", "旧网页导航已取消。"); navigationId = 0; }
        if (navigationTimeout != null) main.removeCallbacks(navigationTimeout);
        WebView previous = browser;
        if (previous.getParent() instanceof ViewGroup) ((ViewGroup) previous.getParent()).removeView(previous);
        previous.stopLoading(); previous.destroy();
        createBrowser(load); changed();
    }
    public void start() {
        requestedStart = true;
        if (!ready || running || destroyed) return;
        try { server = new LoopbackServer(8787, apiKey, this); running = true; state = "桥已启动 · 127.0.0.1:8787"; }
        catch (IOException e) { state = "启动失败：8787 端口被占用"; }
        event(running ? "本机服务已启动" : "本机端口启动失败"); changed();
    }
    public void stop() {
        requestedStart = false; running = false;
        js("AndroidEngine.cancelAll()");
        if (server != null) try { server.close(); } catch (IOException ignored) {}
        server = null;
        for (String id : new ArrayList<>(exchanges.keySet())) cancel(id);
        exchanges.clear();
        completions.clear();
        if (studioWork==0&&wakeLock.isHeld()) wakeLock.release();
        state = "桥已停止"; event("本机服务已停止"); changed();
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
        dispatchRequest(id, path, body, "", exchange);
    }
    @Override public void dispatchRequest(String id, String path, String body, String requestKey, LoopbackServer.Exchange exchange) {
        final JSONObject request;
        try {
            request = new JSONObject().put("id", id).put("path", path).put("requestKey", requestKey).put("body", body.isEmpty() ? new JSONObject() : new JSONObject(body));
        } catch (JSONException e) { exchange.response(400, "{\"error\":{\"code\":\"invalid_json\",\"message\":\"Body must be a JSON object.\"}}"); return; }
        exchanges.put(id, exchange);
        main.post(() -> {
            if (!ready || !running || destroyed) { exchanges.remove(id); exchange.response(503, "{\"error\":{\"code\":\"engine_unavailable\",\"message\":\"Open the Android bridge app.\"}}"); return; }
            if (path.equals("/v1/chat/completions") || path.equals("/v1/messages") || path.endsWith("/retry")) { completions.add(id); requests++; wakeLock.acquire(11 * 60 * 1000L); state = "桥运行中 · 正在处理请求"; event("收到客户端接口请求"); changed(); }
            js("AndroidEngine.receive(" + request + ")");
        });
    }
    @Override public void cancel(String id) {
        exchanges.remove(id);
        completions.remove(id);
        main.post(() -> { js("AndroidEngine.cancel(" + JSONObject.quote(id) + ")"); if (exchanges.isEmpty() && taskboard.optInt("active") == 0 && studioWork==0 && wakeLock.isHeld()) wakeLock.release(); changed(); });
    }

    private void evaluate(int id, JSONObject argument) throws JSONException {
        final int operationEpoch = engineEpoch;
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
                if (operationEpoch != engineEpoch) return;
                if (destroyed || target != browser) { evaluations.remove(id); fail(id, "REQUEST_CANCELLED", "页面已更换。"); return; }
                if (SystemClock.elapsedRealtime() >= deadline) { evaluations.remove(id); target.evaluateJavascript("delete globalThis[" + key + "]", null); fail(id, "android_webview_timeout", "网页脚本未在时限内完成。"); return; }
                target.evaluateJavascript("(function(){var v=globalThis[" + key + "];if(!v||!v.done)return null;delete globalThis[" + key + "];return JSON.stringify(v);})()", raw -> {
                    if (operationEpoch != engineEpoch) return;
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
        private final int epoch = engineEpoch;
        private boolean current() { return epoch == engineEpoch && !destroyed; }
        @JavascriptInterface public String loadState() { return current() ? localState.load() : "{}"; }
        @JavascriptInterface public String loadClientState() { return current() ? clientState.load() : "{}"; }
        @JavascriptInterface public String loadProviders() { return current() ? providerState.load() : "{}"; }
        @JavascriptInterface public void providerCancel(String id) { if (current()) providers.cancel(id); }
        @JavascriptInterface public void providerRequest(String id, String raw) {
            if (!current()) return;
            final String workId = "custom:" + id;
            main.post(() -> { if (current()) { completions.add(workId); if (!wakeLock.isHeld()) wakeLock.acquire(11*60*1000L); changed(); } });
            providers.request(id,raw,(requestId,value)-> main.post(() -> {
                if (!current() || !trustedEngine()) return;
                js("AndroidEngine.providerEvent("+JSONObject.quote(requestId)+","+value+")");
                String type=value.optString("type");if(type.equals("end")||type.equals("response")||type.equals("error")){completions.remove(workId);if(completions.isEmpty()&&taskboard.optInt("active")==0&&studioWork==0&&wakeLock.isHeld())wakeLock.release();changed();}
            }));
        }
        @JavascriptInterface public boolean saveClientState(String raw) { return current() && clientState.save(raw); }
        @JavascriptInterface public void saveLocalState(int id, String channel, String raw) {
            if (!current()) return;
            if (raw == null || raw.length() > 4000000 || !("client".equals(channel) || "engine".equals(channel) || "provider".equals(channel))) {
                main.post(() -> { if (current()) js("AndroidEngine.stateSaved(" + id + ",false)"); }); return;
            }
            stateWriter.execute(() -> {
                if (!current()) return;
                boolean ok = ("client".equals(channel) ? clientState : "provider".equals(channel) ? providerState : localState).save(raw);
                main.post(() -> { if (current() && trustedEngine()) js("AndroidEngine.stateSaved(" + id + "," + ok + ")"); });
            });
        }
        @JavascriptInterface public void workspaceRequest(int id,String operation,String raw) {
            final JSONObject argument;
            try { if (!current() || raw.length() > 3000000) return; argument = new JSONObject(raw); }
            catch (JSONException error) { return; }
            main.post(() -> {
                if (!current() || !trustedEngine()) return;
                StudioRuntime.Reply reply=(ok,value)-> main.post(()-> {
                    if (!current() || !trustedEngine()) return;
                    try { JSONObject response=new JSONObject().put("ok",ok).put(ok?"value":"error",value);js("AndroidEngine.workspaceRpc("+id+","+response+")"); }
                    catch(JSONException ignored) {}
                });
                if(operation.equals("browser.ui")){computer.ui(argument,reply);return;}
                if(operation.equals("browser.image")){stateWriter.execute(()->{try{reply.done(true,computer.image(argument.optString("id")));}catch(Exception e){reply.done(false,newEvent("error",new JSONObject()));}});return;}
                studio.request(operation,argument,reply);
            });
        }
        @JavascriptInterface public boolean saveState(String raw) { return current() && localState.save(raw); }
        @JavascriptInterface public String storageStatus() { return localState.status(); }
        @JavascriptInterface public boolean agentStrict() { return agentStrict; }
        @JavascriptInterface public boolean searchDefault() { return webSearchDefault; }
        @JavascriptInterface public void startupError(String message) {
            main.post(() -> { if (current() && trustedEngine()) reportStartupError(message); });
        }
        @JavascriptInterface public void ready() {
            main.post(() -> { if (!current() || !trustedEngine()) return; ready = true; state = "引擎就绪"; if (requestedStart) start(); changed(); main.postDelayed(() -> inspectPage(), 1200); });
        }
        @JavascriptInterface public void uiAction(String action, String raw) {
            main.post(() -> {
                if (!current() || !trustedEngine()) return;
                try { JSONObject argument = new JSONObject(raw); if (action.equals("theme")) uiDark = argument.optBoolean("dark"); if (uiHost != null) uiHost.action(action, argument); }
                catch (JSONException ignored) {}
            });
        }
        @JavascriptInterface public void uiLayout(String raw) {
            main.post(() -> { if (!current() || !trustedEngine()) return; try { JSONObject next = new JSONObject(raw); if (next.toString().equals(uiLayout.toString())) return; uiLayout = next; if (onLayout != null) onLayout.run(); } catch (JSONException ignored) {} });
        }
        @JavascriptInterface public void reportUi(String kind, String raw) {
            main.post(() -> {
                if (!current() || !trustedEngine()) return;
                try {
                    if (kind.equals("tasks")) {
                        taskboard = new JSONObject(raw);
                        if (taskboard.optInt("active") > 0 && !wakeLock.isHeld()) wakeLock.acquire(11 * 60 * 1000L);
                        else if (taskboard.optInt("active") == 0 && completions.isEmpty() && studioWork==0 && wakeLock.isHeld()) wakeLock.release();
                    }
                    else if (kind.equals("taskNotice")) toast(new JSONObject(raw).optString("message", "请查看任务状态"));
                    else if (kind.equals("conversations")) conversations = new JSONObject(raw);
                    else if (kind.equals("conversationReset")) {
                        if (new JSONObject(raw).optBoolean("ok")) { event("已重置会话关联，下次调用开始新会话"); toast("下次调用将开始新会话，历史对话已保留"); }
                        else toast("当前请求处理中，请稍后再试");
                    }
                    else if (kind.equals("inspectionStart")) inspecting = true;
                    else if (kind.equals("inspection")) {
                        JSONObject status = new JSONObject(raw); inspecting = false; hasInspection = true;
                        loggedIn = status.optBoolean("loggedIn"); needsVerification = status.optBoolean("needsVerification");
                        reasoningMode = status.optJSONObject("reasoningMode"); if (reasoningMode == null) reasoningMode = new JSONObject();
                        webSearchMode = status.optJSONObject("webSearchMode"); if (webSearchMode == null) webSearchMode = new JSONObject();
                        event(loggedIn ? "网页登录已确认" : needsVerification ? "网页需要手动验证" : "网页登录待确认");
                    } else { inspecting = false; lastError = "暂时无法读取网页状态"; }
                    changed();
                } catch (JSONException ignored) { inspecting = false; changed(); }
            });
        }
        @JavascriptInterface public void timer(int id, long delay) {
            main.post(() -> {
                if (!current() || !trustedEngine()) return;
                Runnable old = timers.remove(id); if (old != null) main.removeCallbacks(old);
                Runnable task = () -> { if (!current()) return; timers.remove(id); js("AndroidEngine.timer(" + id + ")"); };
                timers.put(id, task); main.postDelayed(task, Math.max(0, Math.min(1800000, delay)));
            });
        }
        @JavascriptInterface public void clearTimer(int id) { main.post(() -> { if (!current()) return; Runnable task = timers.remove(id); if (task != null) main.removeCallbacks(task); }); }
        @JavascriptInterface public void request(int id, String operation, String raw) {
            main.post(() -> {
                if (!current() || !trustedEngine()) return;
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
                    else if (operation.equals("showBrowser")) { js("BridgeDashboard.navigate('web')"); changed(); rpc(id, true, true); }
                    else fail(id, "INVALID_OPERATION", "不支持的页面操作。");
                } catch (Exception e) { fail(id, "PAGE_CHANGED", "无法完成页面操作。"); }
            });
        }
        @JavascriptInterface public void response(String id, String kind, String raw) {
            if (!current()) return;
            LoopbackServer.Exchange exchange = exchanges.get(id); if (exchange == null) return;
            try {
                JSONObject payload = new JSONObject(raw);
                if (kind.equals("stream")) exchange.stream();
                else if (kind.equals("data")) exchange.data(payload.getString("text"));
                else if (kind.equals("response")) { exchange.response(payload.getInt("status"), payload.getJSONObject("body").toString()); exchanges.remove(id); completions.remove(id); }
                else if (kind.equals("end")) { exchange.end(); exchanges.remove(id); completions.remove(id); }
                main.post(() -> { if (exchanges.isEmpty() && taskboard.optInt("active") == 0) { if (studioWork==0&&wakeLock.isHeld()) wakeLock.release(); state = running ? "桥运行中 · 等待请求" : "桥已停止"; changed(); main.postDelayed(() -> inspectPage(), 250); } });
            } catch (JSONException e) { exchange.response(500, "{\"error\":{\"code\":\"native_transport_error\"}}"); exchanges.remove(id); }
        }
    }
    public void destroy() {
        stop(); destroyed = true;
        stateWriter.shutdown();
        providers.close();
        computer.close();
        studio.close();
        for (Runnable timer : timers.values()) main.removeCallbacks(timer); timers.clear();
        for (Runnable poll : evaluations.values()) main.removeCallbacks(poll); evaluations.clear();
        CookieManager.getInstance().flush(); browser.stopLoading(); browser.destroy(); engine.destroy();
    }
}
