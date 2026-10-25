package io.github.deepseekbridge;

import android.animation.ValueAnimator;
import android.content.*;
import android.graphics.*;
import android.net.Uri;
import android.os.*;
import android.util.Base64;
import android.view.*;
import android.view.inputmethod.*;
import android.webkit.*;
import android.widget.FrameLayout;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/** A user-visible computer-use surface. Ordinary pages never receive a JS bridge. */
public final class ComputerBrowser {
    public interface Listener { void changed(JSONObject state); void reveal(); }
    private final Context context;
    private final MutableContextWrapper activityContext;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService captures=Executors.newSingleThreadExecutor();
    private final Listener listener;
    private final File captureDirectory;
    private final String observeScript,actionScript;
    private boolean desktop;
    private final LinkedHashMap<String,JSONObject> observedPages=new LinkedHashMap<>();
    private FrameLayout surface;
    private WebView web;
    private Pointer pointer;
    private boolean visible,enabled=true,closed,loading,injecting,busy;
    private int generation,progress,epoch;
    private String observation="",signature="",error="",phase="就绪";
    private double cssWidth,cssHeight;
    private Runnable pendingCancel;
    private JSONObject lastPage,verifiedTarget;
    private boolean humanTouch,navigationPending;
    private long humanUntil,mouseDown;
    private float baseScale;
    private String requestedUrl="";

    public ComputerBrowser(Context context,Listener listener){
        this.context=context;this.listener=listener;activityContext=new MutableContextWrapper(context);
        captureDirectory=new File(context.getCacheDir(),"computer-captures");
        String source="";try(InputStream in=context.getAssets().open("browser-observation.js")){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1)out.write(b,0,n);source=new String(out.toByteArray(),StandardCharsets.UTF_8);}catch(IOException ignored){}
        observeScript=source;
        String actions="";try(InputStream in=context.getAssets().open("browser-actions.js")){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1)out.write(b,0,n);actions=new String(out.toByteArray(),StandardCharsets.UTF_8);}catch(IOException ignored){}actionScript=actions;
        desktop=context.getSharedPreferences("studio-browser",Context.MODE_PRIVATE).getBoolean("desktop",true);
    }
    public void attach(Context activity){activityContext.setBaseContext(activity);}
    public void detach(){activityContext.setBaseContext(context);setVisible(false);if(surface!=null&&surface.getParent() instanceof ViewGroup)((ViewGroup)surface.getParent()).removeView(surface);}
    public FrameLayout surface(){
        if(surface!=null)return surface;
        surface=new FrameLayout(activityContext);surface.setBackgroundColor(Color.TRANSPARENT);
        web=new PageWebView(activityContext);WebSettings s=web.getSettings();
        s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);
        s.setUseWideViewPort(true);s.setLoadWithOverviewMode(true);s.setSupportZoom(true);s.setBuiltInZoomControls(true);s.setDisplayZoomControls(false);s.setSupportMultipleWindows(false);
        configureDesktop();
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setMediaPlaybackRequiresUserGesture(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){boolean blocked=!allowedUrl(request.getUrl().toString());if(blocked&&request.isForMainFrame()){error="只允许 HTTP(S) 网页与本机预览";emit();}return blocked;}
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){String scheme=request.getUrl().getScheme();return allowedUrl(request.getUrl().toString())||!request.isForMainFrame()&&("data".equals(scheme)||"blob".equals(scheme)||"about".equals(scheme))?null:blockedResponse();}
            @Override public void onPageStarted(WebView view,String url,Bitmap icon){view.setVisibility(View.VISIBLE);surface.setBackgroundColor(Color.WHITE);generation++;observation="";navigationPending=true;baseScale=0;loading=true;progress=0;error="";emit();}
            @Override public void onPageCommitVisible(WebView view,String url){if(Objects.equals(url,view.getUrl())){navigationPending=false;desktopViewport();emit();}}
            @Override public void onPageFinished(WebView view,String url){if(!Objects.equals(url,view.getUrl()))return;loading=false;navigationPending=false;progress=100;observation="";if(baseScale<=0)baseScale=view.getScale();showPointer();CookieManager.getInstance().flush();emit();}
            @Override public void onScaleChanged(WebView view,float oldScale,float newScale){if(baseScale<=0&&!loading)baseScale=newScale;generation++;observation="";emit();}
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError failure){if(request.isForMainFrame()){loading=false;error=String.valueOf(failure.getDescription());emit();}}
            @Override public boolean onRenderProcessGone(WebView view,RenderProcessGoneDetail detail){epoch++;cancel();error="浏览器进程退出，请重新打开页面";loading=false;web=null;if(surface!=null){if(surface.getParent() instanceof ViewGroup)((ViewGroup)surface.getParent()).removeView(surface);surface.removeAllViews();surface=null;}view.destroy();emit();return true;}
        });
        web.setWebChromeClient(new WebChromeClient(){@Override public void onProgressChanged(WebView view,int value){progress=value;if(value==100||value/20!=(value-1)/20)emit();}@Override public void onReceivedTitle(WebView view,String title){emit();}});
        web.setDownloadListener((url,agent,disposition,mime,length)->{error="此版本暂不接管网页下载，可复制链接在系统浏览器下载";emit();});
        web.setOnTouchListener((view,event)->{if(!injecting){int action=event.getActionMasked();if(action==MotionEvent.ACTION_DOWN){humanTouch=true;humanActivity();}else if(action==MotionEvent.ACTION_UP||action==MotionEvent.ACTION_CANCEL){humanTouch=false;humanUntil=SystemClock.uptimeMillis()+650;emit();}}return false;});
        web.setVisibility(View.INVISIBLE);pointer=new Pointer(activityContext);surface.addView(web,new FrameLayout.LayoutParams(-1,-1));surface.addView(pointer,new FrameLayout.LayoutParams(-1,-1));
        surface.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or,ob)->{if(r-l!=or-ol||b-t!=ob-ot){generation++;observation="";showPointer();}});
        return surface;
    }
    private static WebResourceResponse blockedResponse(){return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
    public static boolean allowedUrl(String value){
        if(value==null||value.length()>4096)return false;
        try{Uri u=Uri.parse(value);String scheme=u.getScheme(),host=u.getHost();return ("http".equalsIgnoreCase(scheme)||"https".equalsIgnoreCase(scheme))&&host!=null&&!host.isEmpty()&&!"bridge.local".equalsIgnoreCase(host)&&u.getUserInfo()==null;}catch(Exception e){return false;}
    }
    public static String normalizeUrl(String value)throws IOException{
        String text=value==null?"":value.trim();if(!text.contains("://"))text=(text.matches("(?i)^(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?(/.*)?$")?"http://":"https://")+text;
        if(!allowedUrl(text))throw new IOException("请输入 HTTP(S) 网址；内部界面地址不可在浏览器打开");return text;
    }
    public static double coordinate(JSONObject a,String key,double size)throws IOException{
        double value=a.optDouble(key,Double.NaN);if(!Double.isFinite(value)||value<0||value>=size)throw new IOException("光标坐标超出当前可见页面，请重新观察");return value;
    }
    public void setVisible(boolean value){if(visible&&!value){epoch++;observation="";cancel();}visible=value;if(web!=null){if(value){web.onResume();showPointer();}else web.onPause();}}
    public boolean visible(){return visible;}
    private void showPointer(){if(pointer==null)return;pointer.shown=enabled;pointer.x=Math.max(4,Math.min(pointer.x,Math.max(4,web.getWidth()-26)));pointer.y=Math.max(4,Math.min(pointer.y,Math.max(4,web.getHeight()-32)));pointer.bringToFront();pointer.invalidate();}
    /** Human input wins the current operation, while permission for later AI steps survives. */
    void humanActivity(){if(Looper.myLooper()!=Looper.getMainLooper()){main.post(this::humanActivity);return;}if(injecting)return;humanUntil=SystemClock.uptimeMillis()+650;observation="";generation++;epoch++;cancel();phase=enabled?"人机协作 · 你正在操作":"你正在接管";emit();}
    private void navigateTo(String url){requestedUrl=url;navigationPending=true;loading=true;observation="";web.loadUrl(url);}
    private double zoom(){return web==null||baseScale<=0?1:Math.max(.25,Math.min(5,web.getScale()/baseScale));}
    private void setZoom(double value)throws IOException{if(!Double.isFinite(value)||value<.5||value>3)throw new IOException("缩放范围为 50%–300%");if(web==null)throw new IOException("请先打开网页");if(baseScale<=0)baseScale=web.getScale();double current=zoom();observation="";generation++;web.zoomBy((float)(value/current));showPointer();}
    public void takeOver(){enabled=false;observation="";epoch++;cancel();if(pointer!=null){pointer.shown=false;pointer.invalidate();}phase="你正在接管";emit();}
    public void cancel(){if(pendingCancel!=null){Runnable task=pendingCancel;pendingCancel=null;task.run();}if(pointer!=null)pointer.stop();}
    public JSONObject state(){JSONObject j=new JSONObject();try{j.put("url",web==null?"":Objects.toString(web.getUrl(),"")).put("title",web==null?"新标签页":Objects.toString(web.getTitle(),"网页")).put("loading",loading).put("progress",progress).put("canBack",web!=null&&web.canGoBack()).put("canForward",web!=null&&web.canGoForward()).put("enabled",enabled).put("busy",busy).put("phase",phase).put("error",error).put("visible",visible).put("zoom",zoom()).put("desktop",desktop).put("humanActive",humanTouch||SystemClock.uptimeMillis()<humanUntil).put("pointerVisible",pointer!=null&&pointer.shown);}catch(JSONException ignored){}return j;}
    private void emit(){if(Looper.myLooper()!=Looper.getMainLooper()){main.post(this::emit);return;}if(!closed)listener.changed(state());}
    public void ui(JSONObject a,StudioRuntime.Reply reply){
        try{switch(a.optString("action")){
            case "status":break;
            case "allow":enabled=true;phase="人机协作";error="";showPointer();break;
            case "takeover":takeOver();break;
            case "open":humanActivity();surface();navigateTo(normalizeUrl(a.optString("url")));break;
            case "back":humanActivity();if(web!=null&&web.canGoBack())web.goBack();break;
            case "forward":humanActivity();if(web!=null&&web.canGoForward())web.goForward();break;
            case "reload":humanActivity();if(web!=null)web.reload();break;
            case "stop":humanActivity();if(web!=null)web.stopLoading();loading=false;navigationPending=false;break;
            case "desktop":humanActivity();desktop=a.optBoolean("enabled",true);context.getSharedPreferences("studio-browser",Context.MODE_PRIVATE).edit().putBoolean("desktop",desktop).apply();surface();configureDesktop();if(web.getUrl()!=null)web.reload();break;
            case "zoom":humanActivity();setZoom(a.has("scale")?a.getDouble("scale"):Math.max(.5,Math.min(3,zoom()*a.optDouble("factor",1))));break;
            default:throw new IOException("未知浏览器操作");
        }emit();reply.done(true,state());}catch(Exception e){JSONObject value=new JSONObject();try{value.put("message",e.getMessage());}catch(JSONException ignored){}reply.done(false,value);}
    }
    /** Called by the worker-owned tool journal, never blocks the main thread. */
    public JSONObject tool(String callId,JSONObject args)throws Exception{
        CountDownLatch done=new CountDownLatch(1);JSONObject[] result={null};Exception[] failure={null};int[] ticket={-1};
        main.post(()->{
            if(closed||busy){failure[0]=new IOException("浏览器已关闭或正在处理另一项操作");done.countDown();return;}
            busy=true;int token=++epoch;ticket[0]=token;phase=actionLabel(args.optString("action"));error="";
            Runnable interrupted=()->{if(done.getCount()==0)return;failure[0]=new IOException("浏览器操作已停止，请重新观察页面");busy=false;done.countDown();};pendingCancel=interrupted;
            if(!(activityContext.getBaseContext() instanceof android.app.Activity)){interrupted.run();return;}
            listener.reveal();surface();emit();
            main.post(new Runnable(){int tries;public void run(){if(done.getCount()==0||token!=epoch)return;if(!visible||surface.getWidth()<10||surface.getHeight()<10){if(++tries<30){main.postDelayed(this,40);return;}fail(new IOException("请保持应用前台，并打开 AI 浏览器"));return;}perform(args,token,(ok,value)->{if(done.getCount()==0)return;pendingCancel=null;busy=false;phase=ok?"等待下一步":"需要处理";if(ok)result[0]=(JSONObject)value;else failure[0]=new IOException(String.valueOf(value));emit();done.countDown();});}void fail(Exception e){failure[0]=e;pendingCancel=null;busy=false;emit();done.countDown();}});
        });
        if(!done.await(18,TimeUnit.SECONDS)){main.post(()->{if(ticket[0]==epoch){epoch++;cancel();}});throw new IOException("浏览器操作超时，未自动重复执行");}
        if(failure[0]!=null)throw failure[0];return result[0];
    }
    private void perform(JSONObject original,int token,StudioRuntime.Reply reply){
        try{
            JSONObject a=new JSONObject(original.toString());String action=a.getString("action");
            if(!action.equals("observe")&&!enabled)throw new IOException("浏览器已明确接管，请重新允许 AI 操作");
            if(!action.equals("observe")&&(humanTouch||SystemClock.uptimeMillis()<humanUntil)){main.postDelayed(()->{if(token==epoch)perform(a,token,reply);},700);return;}
            if(action.equals("open")){navigateTo(normalizeUrl(a.optString("url")));main.postDelayed(()->waitLoaded(token,reply,0),250);return;}
            if(action.equals("observe")){waitLoaded(token,reply,0);return;}
            if(loading||navigationPending){waitReadyForAction(a,token,reply,0);return;}
            freshAction(a,token,reply);
        }catch(Exception e){reply.done(false,e.getMessage());}
    }
    private void waitReadyForAction(JSONObject a,int token,StudioRuntime.Reply reply,int attempt){if(token!=epoch||closed)return;if(loading||navigationPending){if(attempt>=55){reply.done(false,"网页仍在加载，未执行操作；请检查网络或页面");return;}main.postDelayed(()->waitReadyForAction(a,token,reply,attempt+1),150);return;}freshAction(a,token,reply);}
    private void freshAction(JSONObject a,int token,StudioRuntime.Reply reply){
        web.evaluateJavascript(observeScript,raw->{if(token!=epoch||closed)return;try{
            JSONObject live=(JSONObject)new JSONTokener(raw).nextValue(),source=observedPages.get(a.optString("observation"));if(source==null)source=lastPage;
            cssWidth=live.getJSONObject("viewport").getDouble("width");cssHeight=live.getJSONObject("viewport").getDouble("height");String action=a.getString("action");
            if(a.optString("ref").isEmpty()&&a.optString("target").isEmpty()&&(action.equals("click")||action.equals("move"))&&source!=null){JSONArray controls=source.optJSONArray("elements");double x=a.optDouble("x",-1),y=a.optDouble("y",-1);if(controls!=null)for(int i=controls.length()-1;i>=0;i--){JSONObject e=controls.getJSONObject(i);JSONArray b=e.optJSONArray("bounds");if(b!=null&&x>=b.optDouble(0)&&x<b.optDouble(0)+b.optDouble(2)&&y>=b.optDouble(1)&&y<b.optDouble(1)+b.optDouble(3)){if(!source.optString("documentId").equals(live.optString("documentId")))throw new IOException("当前文档已变化，旧坐标未执行");a.put("ref",e.getString("ref"));break;}}}
            boolean edit=action.equals("type")||action.equals("clear")||action.equals("delete")||action.equals("key")&&Arrays.asList("BACKSPACE","DELETE","SELECTALL","CTRL+A").contains(a.optString("key").toUpperCase(Locale.ROOT));
            if(!a.optString("ref").isEmpty()&&source!=null){JSONObject old=findRef(source,a.getString("ref"));if(old!=null){if(!source.optString("documentId").equals(live.optString("documentId")))throw new IOException("当前网页已更换，旧目标未执行");a.put("expectedLabel",old.optString("label"));if(old.has("href"))a.put("expectedHref",old.getString("href"));}}
            lastPage=live;
            if(!a.optString("ref").isEmpty()||!a.optString("target").isEmpty()||edit){
                a.put("documentId",live.optString("documentId"));JSONObject prepare=new JSONObject(a.toString()).put("phase","prepare");
                pageAction(prepare,token,(ok,value)->{if(!ok){reply.done(false,value);return;}try{verifiedTarget=(JSONObject)value;a.put("ref",verifiedTarget.getString("ref"));if(action.equals("click")||action.equals("move")){
                    float x=(float)(verifiedTarget.getDouble("x")*web.getWidth()/cssWidth),y=(float)(verifiedTarget.getDouble("y")*web.getHeight()/cssHeight);
                    pointer.move(x,y,()->{if(token!=epoch)return;if(action.equals("move")){hover(x,y);waitLoaded(token,reply,0);}else if(a.optString("strategy","auto").equals("native"))nativeClick(x,y,token,()->main.postDelayed(()->waitLoaded(token,reply,0),300));else{pointer.pulse();pageAction(a,token,(accepted,result)->{if(!accepted){reply.done(false,result);return;}main.postDelayed(()->waitLoaded(token,reply,0),250);});}});
                }else if(edit){pageAction(a,token,(accepted,result)->{if(!accepted){reply.done(false,result);return;}waitLoaded(token,reply,0);});}
                else execute(a,token,reply);
                }catch(Exception e){reply.done(false,e.getMessage());}});return;
            }
            if((action.equals("click")||action.equals("move"))&&(source==null||!sameViewport(source.optJSONObject("viewport"),live.optJSONObject("viewport"))))throw new IOException("画布坐标的视口已变化，请观察后再操作");
            verifiedTarget=null;execute(a,token,reply);
        }catch(Exception e){reply.done(false,e.getMessage());}});
    }
    private void pageAction(JSONObject a,int token,StudioRuntime.Reply reply){
        if(actionScript.isEmpty()){reply.done(false,"浏览器动作脚本缺失，请更新完整 APK");return;}
        String key="__studio_action_"+UUID.randomUUID().toString().replace("-",""),quoted=JSONObject.quote(key);int document=generation;
        String source="(function(){var k="+quoted+";globalThis[k]={done:false};Promise.resolve(("+actionScript+")("+a+")).then(v=>globalThis[k]={done:true,ok:true,value:v},e=>globalThis[k]={done:true,ok:false,error:String(e.message||e)});})()";
        web.evaluateJavascript(source,ignored->main.post(new Runnable(){int tries;public void run(){if(token!=epoch||closed)return;web.evaluateJavascript("JSON.stringify(globalThis["+quoted+"]||null)",raw->{if(token!=epoch||closed)return;try{Object decoded=new JSONTokener(raw).nextValue();JSONObject state=decoded instanceof String?new JSONObject((String)decoded):null;if(state!=null&&state.optBoolean("done")){web.evaluateJavascript("delete globalThis["+quoted+"]",null);reply.done(state.optBoolean("ok"),state.opt(state.optBoolean("ok")?"value":"error"));return;}if(generation!=document&&a.optString("action").equals("click")){reply.done(true,new JSONObject().put("accepted",true).put("navigation",true));return;}if(++tries>=100){reply.done(false,"页面未确认操作结果，未自动重复执行");return;}main.postDelayed(this,40);}catch(Exception e){if(generation!=document&&a.optString("action").equals("click")){reply.done(true,new JSONObject());return;}reply.done(false,"页面已变化，请检查结果；未自动重复操作");}});}}));
    }
    private void configureDesktop(){if(web==null)return;String ua=WebSettings.getDefaultUserAgent(context);java.util.regex.Matcher m=java.util.regex.Pattern.compile("Chrome/[0-9.]+").matcher(ua);String version=m.find()?m.group():"Chrome/120.0.0.0";web.getSettings().setUserAgentString(desktop?"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "+version+" Safari/537.36":ua);}
    private void desktopViewport(){if(desktop&&web!=null)web.evaluateJavascript("(function(){var e=document.querySelector('meta[name=viewport]');if(!e){e=document.createElement('meta');e.name='viewport';document.head.append(e)}e.content='width=1280';})()",null);}
    static String signatureOf(JSONObject value){return value.optString("url")+"|"+value.optJSONObject("viewport")+"|"+value.optJSONArray("elements");}
    static JSONObject findRef(JSONObject page,String ref){JSONArray es=page.optJSONArray("elements");if(es!=null)for(int i=0;i<es.length();i++){JSONObject e=es.optJSONObject(i);if(e!=null&&ref.equals(e.optString("ref")))return e;}return null;}
    static boolean sameViewport(JSONObject old,JSONObject live){if(old==null||live==null)return false;for(String k:new String[]{"width","height","scrollX","scrollY","scale"})if(Math.abs(old.optDouble(k,0)-live.optDouble(k,0))>(k.equals("scale")?.01:2))return false;return true;}
    /** Dynamic labels elsewhere on a page must not invalidate an unchanged target. */
    static JSONObject validateAction(JSONObject a,JSONObject old,JSONObject live)throws IOException{
        if(old==null||!old.optString("url").equals(live.optString("url"))||!sameViewport(old.optJSONObject("viewport"),live.optJSONObject("viewport")))throw new IOException("网页地址或视口已变化，请重新 observe");
        String action=a.optString("action"),ref=a.optString("ref");JSONObject target=null;
        boolean edit=action.equals("type")||action.equals("clear")||action.equals("delete")||action.equals("key")&&Arrays.asList("BACKSPACE","DELETE","SELECTALL","CTRL+A").contains(a.optString("key").toUpperCase(Locale.ROOT));
        if(ref.isEmpty()&&edit){JSONObject f=old.optJSONObject("focused");if(f==null||!f.optBoolean("editable"))throw new IOException("没有已确认的输入焦点；请传入输入框 ref 或先点击输入框");ref=f.optString("ref");JSONObject now=live.optJSONObject("focused");if(now==null||!ref.equals(now.optString("ref")))throw new IOException("输入焦点已变化，请重新 observe");}
        if(!ref.isEmpty()){JSONObject prior=findRef(old,ref);target=findRef(live,ref);if(prior==null||target==null||target.optBoolean("disabled"))throw new IOException("目标控件已消失、被遮挡或禁用，请重新 observe");for(String key:new String[]{"role","label","type","href"})if(!prior.optString(key).equals(target.optString(key)))throw new IOException("目标控件内容已变化，请重新 observe");if(edit&&!target.optBoolean("editable"))throw new IOException("目标不是可编辑输入框");return target;}
        if(action.equals("click")){
            double x=coordinate(a,"x",old.optJSONObject("viewport").optDouble("width")),y=coordinate(a,"y",old.optJSONObject("viewport").optDouble("height"));
            JSONArray es=old.optJSONArray("elements");if(es!=null)for(int i=es.length()-1;i>=0;i--){JSONObject e=es.optJSONObject(i);JSONArray b=e==null?null:e.optJSONArray("bounds");if(b!=null&&x>=b.optDouble(0)&&x<b.optDouble(0)+b.optDouble(2)&&y>=b.optDouble(1)&&y<b.optDouble(1)+b.optDouble(3)){JSONObject now=findRef(live,e.optString("ref"));if(now==null)throw new IOException("点击目标已变化，请重新 observe 或使用 ref");for(String k:new String[]{"role","label","type","href"})if(!e.optString(k).equals(now.optString(k)))throw new IOException("点击目标已变化，请重新 observe");JSONArray nb=now.optJSONArray("bounds");if(now.optBoolean("disabled")||nb==null||x<nb.optDouble(0)||x>=nb.optDouble(0)+nb.optDouble(2)||y<nb.optDouble(1)||y>=nb.optDouble(1)+nb.optDouble(3))throw new IOException("目标已移动，请重新 observe 或使用 ref");break;}}
        }
        return null;
    }
    private void execute(JSONObject a,int token,StudioRuntime.Reply reply){
        try{
            String action=a.getString("action");
            if(action.equals("move")||action.equals("click")){
                JSONObject point=verifiedTarget==null?a:verifiedTarget;
                float x=(float)(coordinate(point,"x",cssWidth)*web.getWidth()/cssWidth),y=(float)(coordinate(point,"y",cssHeight)*web.getHeight()/cssHeight);
                pointer.move(x,y,()->{if(token!=epoch||!enabled)return;if(action.equals("click")){
                    web.evaluateJavascript(observeScript,raw->{if(token!=epoch||closed)return;try{
                        if(loading)throw new IOException("网页仍在加载");
                        JSONObject live=(JSONObject)new JSONTokener(raw).nextValue(),target=validateAction(a,lastPage,live),pointNow=target==null?a:target;
                        float nx=(float)(coordinate(pointNow,"x",cssWidth)*web.getWidth()/cssWidth),ny=(float)(coordinate(pointNow,"y",cssHeight)*web.getHeight()/cssHeight);
                        pointer.x=nx;pointer.y=ny;pointer.invalidate();observation="";nativeClick(nx,ny,token,()->main.postDelayed(()->waitLoaded(token,reply,0),300));
                    }catch(Exception e){reply.done(false,e.getMessage());}});
                }else{observation="";injecting=true;try{hover(x,y);}finally{injecting=false;}waitLoaded(token,reply,0);}});return;
            }
            observation="";
            if(action.equals("scroll")){double dy=a.optDouble("dy",0),dx=a.optDouble("dx",0);if(!Double.isFinite(dx)||!Double.isFinite(dy)||Math.abs(dx)>cssWidth*2||Math.abs(dy)>cssHeight*2)throw new IOException("单次滚动最多两个视口");web.scrollBy((int)Math.round(dx*web.getWidth()/cssWidth),(int)Math.round(dy*web.getHeight()/cssHeight));}
            else if(action.equals("type")||action.equals("clear")||action.equals("delete")){edit(a,token,reply);return;}
            else if(action.equals("key")){if(verifiedTarget!=null){edit(a,token,reply);return;}injecting=true;try{applyKey(a,web);}finally{injecting=false;}}
            else if(action.equals("zoom"))setZoom(a.getDouble("scale"));
            else if(action.equals("back")){if(web.canGoBack())web.goBack();}
            else if(action.equals("forward")){if(web.canGoForward())web.goForward();}
            else if(action.equals("reload"))web.reload();
            else throw new IOException("未知 computer-use 动作");
            main.postDelayed(()->waitLoaded(token,reply,0),250);
        }catch(Exception e){reply.done(false,e.getMessage());}
    }
    private void nativeClick(float x,float y,int token,Runnable done){
        pointer.pulse();injecting=true;try{web.requestFocusFromTouch();hover(x,y);touch(MotionEvent.ACTION_DOWN,x,y);}finally{injecting=false;}
        main.postDelayed(()->{if(token!=epoch||!enabled){injecting=true;try{touch(MotionEvent.ACTION_CANCEL,x,y);}finally{injecting=false;}return;}injecting=true;try{touch(MotionEvent.ACTION_UP,x,y);}finally{injecting=false;}done.run();},50);
    }
    private void edit(JSONObject a,int token,StudioRuntime.Reply reply)throws Exception{
        if(verifiedTarget==null)throw new IOException("请先 observe 确认可编辑输入框");
        String ref=verifiedTarget.getString("ref");Runnable performEdit=()->{
            if(token!=epoch||closed)return;
            web.evaluateJavascript(observeScript,raw->{if(token!=epoch||closed)return;try{
                JSONObject live=(JSONObject)new JSONTokener(raw).nextValue(),focus=live.optJSONObject("focused");
                if(focus==null||!ref.equals(focus.optString("ref"))||!focus.optBoolean("editable"))throw new IOException("未获得目标输入框焦点，未改写任何文本；请重新 observe");
                injecting=true;try{if(a.optString("action").equals("key"))applyKey(a,web);else applyEdit(a,web);}finally{injecting=false;}
                main.postDelayed(()->waitLoaded(token,reply,0),180);
            }catch(Exception e){reply.done(false,e.getMessage());}});
        };
        JSONObject focus=lastPage==null?null:lastPage.optJSONObject("focused");
        if(a.has("ref")&&(focus==null||!ref.equals(focus.optString("ref")))){
            float x=(float)(verifiedTarget.getDouble("x")*web.getWidth()/cssWidth),y=(float)(verifiedTarget.getDouble("y")*web.getHeight()/cssHeight);
            pointer.move(x,y,()->nativeClick(x,y,token,()->main.postDelayed(performEdit,120)));
        }else performEdit.run();
    }
    static void applyEdit(JSONObject a,WebView web)throws Exception{
        String action=a.getString("action"),text=action.equals("type")?a.getString("text"):"";if(text.length()>16000)throw new IOException("单次输入最多 16000 字符");
        InputConnection input=web.onCreateInputConnection(new EditorInfo());if(input==null)throw new IOException("当前输入框没有可用的输入连接");
        input.beginBatchEdit();try{input.finishComposingText();boolean accepted;
            if(action.equals("delete")){int count=a.optInt("count",1);if(count<1||count>1000)throw new IOException("单次删除 1–1000 个字符");String direction=a.optString("direction","backward");if(!direction.equals("forward")&&!direction.equals("backward"))throw new IOException("删除方向必须是 backward 或 forward");boolean forward=direction.equals("forward");CharSequence selected=input.getSelectedText(0);accepted=selected!=null&&selected.length()>0?input.commitText("",1):input.deleteSurroundingTextInCodePoints(forward?0:count,forward?count:0);}
            else{if((action.equals("clear")||a.optBoolean("clear"))&&!input.performContextMenuAction(android.R.id.selectAll))throw new IOException("当前输入框未接受全选，未替换文本");accepted=input.commitText(action.equals("clear")?"":text,1);}
            if(!accepted)throw new IOException("当前控件未接受输入或删除");
        }finally{input.endBatchEdit();}
    }
    static void applyKey(JSONObject a,WebView web)throws Exception{String key=a.optString("key");if(key.equalsIgnoreCase("SELECTALL")||key.equalsIgnoreCase("CTRL+A")){InputConnection input=web.onCreateInputConnection(new EditorInfo());if(input==null||!input.performContextMenuAction(android.R.id.selectAll))throw new IOException("当前输入框未接受全选");}else{int code=keyCode(key);if(code==-1)throw new IOException("不支持的按键");web.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,code));web.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,code));}}
    static String actionLabel(String action){switch(action){case "open":return "AI 正在打开网页";case "observe":return "AI 正在观察页面";case "move":return "AI 正在移动光标";case "click":return "AI 正在点击";case "type":return "AI 正在输入";case "clear":case "delete":return "AI 正在删除文本";case "zoom":return "AI 正在缩放";case "key":return "AI 正在按键";case "scroll":return "AI 正在滚动";default:return "AI 正在浏览";}}
    static int keyCode(String key){switch(key.toUpperCase(Locale.ROOT)){case "ENTER":return KeyEvent.KEYCODE_ENTER;case "TAB":return KeyEvent.KEYCODE_TAB;case "ESCAPE":return KeyEvent.KEYCODE_ESCAPE;case "BACKSPACE":return KeyEvent.KEYCODE_DEL;case "DELETE":return KeyEvent.KEYCODE_FORWARD_DEL;case "ARROWUP":return KeyEvent.KEYCODE_DPAD_UP;case "ARROWDOWN":return KeyEvent.KEYCODE_DPAD_DOWN;case "ARROWLEFT":return KeyEvent.KEYCODE_DPAD_LEFT;case "ARROWRIGHT":return KeyEvent.KEYCODE_DPAD_RIGHT;case "HOME":return KeyEvent.KEYCODE_MOVE_HOME;case "END":return KeyEvent.KEYCODE_MOVE_END;default:return -1;}}
    private void touch(int action,float x,float y){long now=SystemClock.uptimeMillis();if(action==MotionEvent.ACTION_DOWN)mouseDown=now;MotionEvent.PointerProperties pointer=new MotionEvent.PointerProperties();pointer.id=0;pointer.toolType=MotionEvent.TOOL_TYPE_MOUSE;MotionEvent.PointerCoords point=new MotionEvent.PointerCoords();point.x=x;point.y=y;point.pressure=action==MotionEvent.ACTION_DOWN?1:0;point.size=1;MotionEvent event=MotionEvent.obtain(mouseDown,now,action,1,new MotionEvent.PointerProperties[]{pointer},new MotionEvent.PointerCoords[]{point},0,action==MotionEvent.ACTION_DOWN?MotionEvent.BUTTON_PRIMARY:0,1,1,0,0,InputDevice.SOURCE_MOUSE,0);web.dispatchTouchEvent(event);event.recycle();}
    private void hover(float x,float y){long now=SystemClock.uptimeMillis();MotionEvent event=MotionEvent.obtain(now,now,MotionEvent.ACTION_HOVER_MOVE,x,y,0);event.setSource(android.view.InputDevice.SOURCE_MOUSE);if(web instanceof PageWebView)((PageWebView)web).mouseHover(event);else web.dispatchGenericMotionEvent(event);event.recycle();}
    private void waitLoaded(int token,StudioRuntime.Reply reply,int tries){if(token!=epoch||closed)return;if((loading||navigationPending)&&tries<55){main.postDelayed(()->waitLoaded(token,reply,tries+1),180);return;}if(navigationPending){reply.done(false,"网页导航尚未提交，未返回旧页面；请重新 observe 确认目标网址");return;}observe(token,reply);}
    private void observe(int token,StudioRuntime.Reply reply){
        if(token!=epoch||closed)return;
        if(observeScript.isEmpty()){reply.done(false,"页面观察脚本缺失，请更新安装包");return;}
        int page=generation;
        web.evaluateJavascript(observeScript,raw->{
            if(token!=epoch||closed)return;
            try{if(page!=generation)throw new IOException("网页正在跳转，请重新观察");Object decoded=new JSONTokener(raw).nextValue();if(!(decoded instanceof JSONObject))throw new IOException("网页尚未准备好，请重新观察");JSONObject result=(JSONObject)decoded;
                cssWidth=result.getJSONObject("viewport").getDouble("width");cssHeight=result.getJSONObject("viewport").getDouble("height");if(cssWidth<1||cssHeight<1)throw new IOException("页面没有可见视口");
                lastPage=new JSONObject(result.toString());signature=signatureOf(result);observation=UUID.randomUUID().toString();observedPages.put(observation,lastPage);while(observedPages.size()>12)observedPages.remove(observedPages.keySet().iterator().next());showPointer();result.put("observation",observation).put("ok",true).put("loading",loading).put("requestedUrl",requestedUrl).put("navigationPending",navigationPending).put("controlEnabled",enabled).put("humanActive",humanTouch||SystemClock.uptimeMillis()<humanUntil).put("zoom",zoom());
                final String id=UUID.randomUUID().toString();final int width=web.getWidth(),height=web.getHeight();float ratio=Math.min(1f,Math.min(1024f/width,(float)Math.sqrt(1200000d/width/height)));
                final Bitmap image=Bitmap.createBitmap(Math.max(1,Math.round(width*ratio)),Math.max(1,Math.round(height*ratio)),Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(image);canvas.scale(ratio,ratio);surface.draw(canvas);
                captures.execute(()->{try{if(!captureDirectory.isDirectory()&&!captureDirectory.mkdirs())throw new IOException("截图缓存不可用");File target=new File(captureDirectory,id+".jpg");try(FileOutputStream out=new FileOutputStream(target)){image.compress(Bitmap.CompressFormat.JPEG,72,out);}result.put("screenshot",new JSONObject().put("id",id).put("url","https://bridge.local/browser-capture/"+id+".jpg").put("width",image.getWidth()).put("height",image.getHeight()));trimCaptures();main.post(()->{if(token==epoch&&!closed)reply.done(true,result);});}catch(Exception e){main.post(()->{if(token==epoch&&!closed)reply.done(false,"截图失败："+e.getMessage());});}finally{image.recycle();}});
            }catch(Exception e){reply.done(false,e.getMessage());}
        });
    }
    private void trimCaptures(){File[] files=captureDirectory.listFiles((dir,name)->name.endsWith(".jpg"));if(files==null)return;Arrays.sort(files,Comparator.comparingLong(File::lastModified).reversed());for(int i=8;i<files.length;i++)files[i].delete();}
    public File captureFile(String id)throws IOException{if(!id.matches("[a-f0-9-]{36}"))throw new IOException("Invalid capture ID");File file=new File(captureDirectory,id+".jpg");if(!file.isFile())throw new IOException("截图已过期，请重新观察");return file;}
    public String image(String id)throws IOException{File file=captureFile(id);if(file.length()>1500000)throw new IOException("截图过大");ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=new FileInputStream(file)){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}return "data:image/jpeg;base64,"+Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);}
    public void close(){closed=true;epoch++;cancel();captures.shutdown();if(web!=null)web.destroy();}

    private final class PageWebView extends WebView {
        PageWebView(Context context){super(context);}void mouseHover(MotionEvent event){super.dispatchHoverEvent(event);}
        @Override public InputConnection onCreateInputConnection(EditorInfo info){InputConnection base=super.onCreateInputConnection(info);if(base==null)return null;return new InputConnectionWrapper(base,false){
            @Override public boolean commitText(CharSequence text,int cursor){humanActivity();return super.commitText(text,cursor);}
            @Override public boolean setComposingText(CharSequence text,int cursor){humanActivity();return super.setComposingText(text,cursor);}
            @Override public boolean deleteSurroundingText(int before,int after){humanActivity();return super.deleteSurroundingText(before,after);}
            @Override public boolean deleteSurroundingTextInCodePoints(int before,int after){humanActivity();return super.deleteSurroundingTextInCodePoints(before,after);}
        };}
        @Override public boolean onKeyDown(int key,KeyEvent event){if(!injecting)humanActivity();return super.onKeyDown(key,event);}
    }
    /** Noninteractive, transparent cursor; clicks continue to the actual WebView. */
    static final class Pointer extends View {
        final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);float x=30,y=40,pulse;boolean shown;ValueAnimator animator;
        Pointer(Context c){super(c);setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);setClickable(false);setFocusable(false);setElevation(8*c.getResources().getDisplayMetrics().density);setLayerType(LAYER_TYPE_SOFTWARE,null);}
        void move(float nextX,float nextY,Runnable done){stop();shown=true;final float oldX=x,oldY=y;animator=ValueAnimator.ofFloat(0,1);animator.setDuration(160);animator.addUpdateListener(a->{float f=(float)a.getAnimatedValue();x=oldX+(nextX-oldX)*f;y=oldY+(nextY-oldY)*f;invalidate();});animator.addListener(new android.animation.AnimatorListenerAdapter(){boolean cancelled;@Override public void onAnimationCancel(android.animation.Animator a){cancelled=true;}@Override public void onAnimationEnd(android.animation.Animator a){if(!cancelled)done.run();}});animator.start();}
        void pulse(){pulse=1;invalidate();postDelayed(()->{pulse=0;invalidate();},160);}
        void stop(){if(animator!=null){animator.cancel();animator=null;}}
        @Override protected void onDraw(Canvas c){if(!shown)return;float d=getResources().getDisplayMetrics().density;c.save();c.translate(x,y);c.scale(d,d);if(pulse>0){paint.setStyle(Paint.Style.FILL);paint.setColor(0x147c7971);c.drawCircle(0,0,7,paint);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(.8f);paint.setColor(0x557c7971);c.drawCircle(0,0,7,paint);}Path p=new Path();p.moveTo(0,0);p.lineTo(.4f,13);p.lineTo(3.7f,9.8f);p.lineTo(6.5f,16);p.lineTo(9,14.8f);p.lineTo(6.1f,9);p.lineTo(11.2f,8.9f);p.close();paint.setStyle(Paint.Style.FILL);paint.setColor(0xfffcfcfa);paint.setShadowLayer(1.2f,0,.6f,0x30000000);c.drawPath(p,paint);paint.clearShadowLayer();paint.setColor(0xff333530);paint.setStyle(Paint.Style.STROKE);paint.setStrokeJoin(Paint.Join.ROUND);paint.setStrokeWidth(.85f);c.drawPath(p,paint);paint.setStyle(Paint.Style.FILL);c.restore();}
    }
}
