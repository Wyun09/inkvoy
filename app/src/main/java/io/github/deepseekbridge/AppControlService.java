package io.github.deepseekbridge;

import android.accessibilityservice.*;
import android.content.*;
import android.content.pm.*;
import android.graphics.*;
import android.os.*;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.view.*;
import android.view.accessibility.*;
import android.widget.Button;
import org.json.*;
import java.io.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;

/** Explicitly armed, foreground-app control. UI trees are read only on request. */
public class AppControlService extends AccessibilityService {
    interface Result{void done(JSONObject value);}
    private static volatile AppControlService instance;
    private static final ExecutorService captures=Executors.newSingleThreadExecutor(r->{Thread t=new Thread(r,"app-capture-encoder");t.setDaemon(true);return t;});
    private final Handler main=new Handler(Looper.getMainLooper());
    private final Map<String,Target> references=new HashMap<>();
    private final Set<String> cancelled=Collections.synchronizedSet(new LinkedHashSet<>());
    private volatile boolean armed;
    private volatile int generation;
    private volatile String operationId="";
    private String observation="",observedPackage="";
    private int observedWindow,observedWidth,observedHeight,scrollEpoch,observedEpoch;
    private long observedAt;
    private Button stop;
    private static final class Target{String path,pkg,viewId,cls,text,description;boolean editable;int window;}
    @Override protected void onServiceConnected(){instance=this;armed=false;generation++;}
    @Override public void onAccessibilityEvent(AccessibilityEvent e){int t=e.getEventType();if(t==AccessibilityEvent.TYPE_VIEW_SCROLLED||t==AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED||t==AccessibilityEvent.TYPE_WINDOWS_CHANGED)scrollEpoch++;}
    @Override public void onInterrupt(){pause();}
    @Override public void onDestroy(){pause();if(instance==this)instance=null;super.onDestroy();}
    static boolean protectedPackage(Context c,String pkg){return pkg==null||pkg.isEmpty()||pkg.equals(c.getPackageName())||pkg.equals("android")||pkg.equals("com.android.systemui")||pkg.equals("com.android.settings")||pkg.contains("permissioncontroller")||pkg.contains("packageinstaller");}
    static Set<String> allowed(Context c){return new HashSet<>(c.getSharedPreferences("studio-app-control",MODE_PRIVATE).getStringSet("allowed",Collections.emptySet()));}
    static JSONObject status(Context c)throws JSONException{
        boolean enabled=false;String saved=Settings.Secure.getString(c.getContentResolver(),Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);ComponentName component=new ComponentName(c,AppControlService.class);
        if(saved!=null)for(String entry:saved.split(":")){ComponentName value=ComponentName.unflattenFromString(entry);if(component.equals(value))enabled=true;}
        AppControlService s=instance;JSONArray apps=new JSONArray();for(String pkg:allowed(c))apps.put(pkg);
        return new JSONObject().put("enabled",enabled||s!=null).put("connected",s!=null).put("armed",s!=null&&s.armed).put("allowedPackages",apps).put("screenshotSupported",Build.VERSION.SDK_INT>=30).put("notice",s==null?"在系统无障碍设置中启用 Inkvoy App 操控":s.armed?"允许操作所选 App；悬浮按钮可随时暂停":"已连接，操作已暂停");
    }
    static JSONObject applications(Context c)throws Exception{
        JSONArray result=new JSONArray();Set<String> seen=new HashSet<>();PackageManager pm=c.getPackageManager();List<ResolveInfo> rows=pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),0);rows.sort(Comparator.comparing(r->String.valueOf(r.loadLabel(pm)),String.CASE_INSENSITIVE_ORDER));
        for(ResolveInfo row:rows){String pkg=row.activityInfo.packageName;if(protectedPackage(c,pkg)||!seen.add(pkg))continue;result.put(new JSONObject().put("package",pkg).put("label",String.valueOf(row.loadLabel(pm))));if(result.length()>=250)break;}
        return new JSONObject().put("apps",result).put("status",status(c));
    }
    static JSONObject configure(Context c,JSONArray packages)throws Exception{
        if(packages.length()>30)throw new IOException("最多选择 30 个允许操控的 App");Set<String> selected=new HashSet<>();for(int i=0;i<packages.length();i++){String pkg=packages.getString(i);if(protectedPackage(c,pkg)||!pkg.matches("[a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)+")||c.getPackageManager().getLaunchIntentForPackage(pkg)==null)throw new IOException("App 不可启动或属于系统授权界面："+pkg);selected.add(pkg);}
        AppControlService s=instance;if(s!=null)return s.await(()->{s.pause();saveSelection(c,selected);return status(c);});saveSelection(c,selected);return status(c);
    }
    private static void saveSelection(Context c,Set<String> selected)throws IOException{if(!c.getSharedPreferences("studio-app-control",MODE_PRIVATE).edit().putStringSet("allowed",selected).commit())throw new IOException("App 选择未能保存");}
    static JSONObject setArmed(Context c,boolean enabled)throws Exception{
        AppControlService s=instance;if(s==null){if(enabled)throw new IOException("请先在系统设置中启用 Inkvoy 无障碍服务");return status(c);}
        return s.await(()->{if(enabled){if(allowed(c).isEmpty())throw new IOException("先选择允许操控的 App");s.armed=true;s.generation++;try{s.showStop();}catch(Exception e){s.pause();throw new IOException("无法显示暂停按钮，操控未启用");}}else s.pause();return status(c);});
    }
    static void cancel(String id){AppControlService s=instance;if(s!=null){s.cancelled.add(id);synchronized(s.cancelled){while(s.cancelled.size()>256)s.cancelled.remove(s.cancelled.iterator().next());}if(id.equals(s.operationId))s.main.post(s::pause);}}
    private interface MainCall{JSONObject run()throws Exception;}
    private JSONObject await(MainCall action)throws Exception{
        if(Looper.myLooper()==Looper.getMainLooper())return action.run();CompletableFuture<JSONObject> future=new CompletableFuture<>();main.post(()->{if(future.isDone())return;try{future.complete(action.run());}catch(Exception e){future.completeExceptionally(e);}});try{return future.get(5,TimeUnit.SECONDS);}catch(TimeoutException e){future.cancel(false);throw new IOException("操控请求超时；未自动重试");}catch(ExecutionException e){throw new IOException(e.getCause().getMessage());}
    }
    static JSONObject tool(Context context,String id,JSONObject a)throws Exception{
        if(a.optString("action").equals("status"))return status(context);AppControlService s=instance;if(s==null)throw new IOException("无障碍服务尚未启用，请由用户开启");
        CompletableFuture<JSONObject> future=new CompletableFuture<>();s.main.post(()->{if(future.isDone())return;try{s.perform(id,a,value->{if(!future.complete(value)){String capture=value.optString("captureFile");if(!capture.isEmpty())new File(capture).delete();}});}catch(Exception e){future.completeExceptionally(e);}});
        try{return future.get(8,TimeUnit.SECONDS);}catch(TimeoutException e){future.cancel(false);cancel(id);throw new IOException("App 操控结果未确认；请重新观察，不要重复操作");}catch(ExecutionException e){throw new IOException(e.getCause().getMessage());}
    }
    void pause(){armed=false;generation++;operationId="";observation="";references.clear();if(stop!=null){try{((WindowManager)getSystemService(WINDOW_SERVICE)).removeView(stop);}catch(Exception ignored){}stop=null;}}
    private void showStop(){if(stop!=null)return;stop=new Button(this);stop.setText("Inkvoy · 暂停操控");stop.setTextSize(12);stop.setTextColor(Color.WHITE);stop.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xff242a32));stop.setContentDescription("暂停 Inkvoy 的 App 操控");stop.setOnClickListener(v->pause());WindowManager.LayoutParams p=new WindowManager.LayoutParams(WindowManager.LayoutParams.WRAP_CONTENT,WindowManager.LayoutParams.WRAP_CONTENT,WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,PixelFormat.TRANSLUCENT);p.gravity=Gravity.TOP|Gravity.END;p.y=48;((WindowManager)getSystemService(WINDOW_SERVICE)).addView(stop,p);}
    private void guard()throws IOException{if(!armed)throw new IOException("App 操控已暂停，请用户在 Inkvoy 中恢复");}
    private AccessibilityNodeInfo foreground()throws IOException{guard();AccessibilityNodeInfo root=getRootInActiveWindow();if(root==null)throw new IOException("当前 App 没有提供可访问窗口，请先解锁并打开允许的 App");String pkg=String.valueOf(root.getPackageName());if(protectedPackage(this,pkg)||!allowed(this).contains(pkg)){root.recycle();throw new IOException("当前界面未获操控许可；可 launch 打开用户所选 App，系统授权界面请用户操作");}return root;}
    private DisplayMetrics screen(){DisplayMetrics d=new DisplayMetrics();((WindowManager)getSystemService(WINDOW_SERVICE)).getDefaultDisplay().getRealMetrics(d);return d;}
    private static String text(CharSequence value){return value==null?"":value.toString().substring(0,Math.min(value.length(),500));}
    private JSONObject observe()throws Exception{
        AccessibilityNodeInfo root=foreground();try{references.clear();JSONArray nodes=new JSONArray();int[] visited={0};collect(root,"0",nodes,visited);DisplayMetrics d=screen();observedPackage=String.valueOf(root.getPackageName());observedWindow=root.getWindowId();observedWidth=d.widthPixels;observedHeight=d.heightPixels;observedEpoch=scrollEpoch;observedAt=SystemClock.uptimeMillis();observation=UUID.randomUUID().toString();return new JSONObject().put("ok",true).put("package",observedPackage).put("window",observedWindow).put("observation",observation).put("viewport",new JSONObject().put("width",d.widthPixels).put("height",d.heightPixels).put("coordinateSpace","physical screen pixels")).put("nodes",nodes).put("truncated",visited[0]>=1200||nodes.length()>=200);}
        finally{root.recycle();}
    }
    private void collect(AccessibilityNodeInfo n,String path,JSONArray nodes,int[] visited)throws Exception{
        if(++visited[0]>1200||nodes.length()>=200)return;
        if(n.isVisibleToUser()&&(n.isClickable()||n.isEditable()||n.isScrollable()||n.getText()!=null||n.getContentDescription()!=null)){
            Rect r=new Rect();n.getBoundsInScreen(r);Target target=new Target();target.path=path;target.pkg=String.valueOf(n.getPackageName());target.window=n.getWindowId();target.viewId=text(n.getViewIdResourceName());target.cls=text(n.getClassName());target.editable=n.isEditable();target.description=text(n.getContentDescription());target.text=n.isPassword()?"":text(n.getText());String ref="node-"+RuntimeInstaller.hex(MessageDigest.getInstance("SHA-256").digest((target.pkg+target.window+path+target.viewId+target.cls+(target.editable?"":target.text+target.description)).getBytes(java.nio.charset.StandardCharsets.UTF_8))).substring(0,16);references.put(ref,target);
            nodes.put(new JSONObject().put("ref",ref).put("text",n.isPassword()?"[密码已隐藏]":target.text).put("label",n.isPassword()?"密码输入框":text(n.getContentDescription())).put("resourceId",target.viewId).put("class",target.cls).put("clickable",n.isClickable()).put("editable",n.isEditable()).put("scrollable",n.isScrollable()).put("enabled",n.isEnabled()).put("checked",n.isChecked()).put("bounds",new JSONArray(new int[]{r.left,r.top,r.right,r.bottom})));
        }
        for(int i=0;i<n.getChildCount()&&visited[0]<1200&&nodes.length()<200;i++){AccessibilityNodeInfo child=n.getChild(i);if(child!=null)try{collect(child,path+"."+i,nodes,visited);}finally{child.recycle();}}
    }
    private AccessibilityNodeInfo target(AccessibilityNodeInfo root,JSONObject a)throws Exception{
        String ref=a.optString("ref");if(!ref.isEmpty()){
            Target t=references.get(ref);if(t==null||!t.pkg.equals(String.valueOf(root.getPackageName()))||t.window!=root.getWindowId())throw new IOException("目标已过期，请 observe 后使用新 ref");AccessibilityNodeInfo node=AccessibilityNodeInfo.obtain(root);String[] parts=t.path.split("\\.");for(int i=1;i<parts.length;i++){AccessibilityNodeInfo child=node.getChild(Integer.parseInt(parts[i]));node.recycle();if(child==null)throw new IOException("目标已离开界面，请重新观察");node=child;}
            if(!t.viewId.equals(text(node.getViewIdResourceName()))||!t.cls.equals(text(node.getClassName()))||!t.editable&&(!t.text.equals(text(node.getText()))||!t.description.equals(text(node.getContentDescription())))){node.recycle();throw new IOException("目标内容已改变，请重新观察");}return node;
        }
        String label=a.optString("target"),resource=a.optString("resource_id");if(label.isEmpty()&&resource.isEmpty())throw new IOException("请提供观察到的 ref 或唯一的目标标签");List<AccessibilityNodeInfo> found=new ArrayList<>();find(root,label,resource,found,new int[]{0});if(found.size()!=1){for(AccessibilityNodeInfo n:found)n.recycle();throw new IOException(found.isEmpty()?"没有找到该目标，请重新观察":"目标标签不唯一，请使用 ref");}return found.get(0);
    }
    private void find(AccessibilityNodeInfo n,String label,String resource,List<AccessibilityNodeInfo> found,int[] count){if(++count[0]>1200||found.size()>1)return;if(n.isVisibleToUser()&&(resource.isEmpty()||resource.equals(n.getViewIdResourceName()))&&(label.isEmpty()||label.equals(text(n.getText()))||label.equals(text(n.getContentDescription()))))found.add(AccessibilityNodeInfo.obtain(n));for(int i=0;i<n.getChildCount()&&count[0]<1200&&found.size()<2;i++){AccessibilityNodeInfo child=n.getChild(i);if(child!=null)try{find(child,label,resource,found,count);}finally{child.recycle();}}}
    void perform(String id,JSONObject a,Result reply)throws Exception{
        guard();if(cancelled.contains(id))throw new IOException("此 App 操作已取消，未执行");if(!operationId.isEmpty())throw new IOException("另一个 App 操作尚未结束");final int ticket=generation;final String action=a.getString("action");operationId=id;
        Result finish=value->{if(operationId.equals(id))operationId="";reply.done(value);};
        try{
            if(action.equals("launch")){String pkg=a.getString("package");if(protectedPackage(this,pkg)||!allowed(this).contains(pkg))throw new IOException("此 App 不在用户选择范围内");Intent intent=getPackageManager().getLaunchIntentForPackage(pkg);if(intent==null)throw new IOException("App 不可启动");startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));after(ticket,action,true,finish,350);return;}
            if(action.equals("observe")){finish.done(observe());return;}
            AccessibilityNodeInfo root=foreground();try{
                if(action.equals("screenshot")){if(Build.VERSION.SDK_INT<30)throw new IOException("Android 11 以下可使用界面元素观察，系统截图需 Android 11+");screenshot(ticket,observe(),scrollEpoch,finish);return;}
                if(action.equals("back")||action.equals("home")||action.equals("recents")){int global=action.equals("back")?GLOBAL_ACTION_BACK:action.equals("home")?GLOBAL_ACTION_HOME:GLOBAL_ACTION_RECENTS;after(ticket,action,performGlobalAction(global),finish,220);return;}
                if(action.equals("swipe")||a.has("x")&&action.equals("click")){
                    DisplayMetrics d=screen();if(!a.optString("observation").equals(observation)||!String.valueOf(root.getPackageName()).equals(observedPackage)||root.getWindowId()!=observedWindow||d.widthPixels!=observedWidth||d.heightPixels!=observedHeight||observedEpoch!=scrollEpoch||SystemClock.uptimeMillis()-observedAt>30000)throw new IOException("坐标观察已过期，请重新 observe 或 screenshot");
                    float x=(float)a.getDouble("x"),y=(float)a.getDouble("y"),endX=action.equals("swipe")?(float)a.getDouble("end_x"):x,endY=action.equals("swipe")?(float)a.getDouble("end_y"):y;for(float v:new float[]{x,y,endX,endY})if(Float.isNaN(v)||Float.isInfinite(v))throw new IOException("坐标无效");if(x<0||endX<0||y<0||endY<0||x>=d.widthPixels||endX>=d.widthPixels||y>=d.heightPixels||endY>=d.heightPixels)throw new IOException("坐标超出屏幕");Path path=new Path();path.moveTo(x,y);if(action.equals("swipe"))path.lineTo(endX,endY);long duration=action.equals("swipe")?Math.max(100,Math.min(700,a.optInt("duration_ms",350))):60;
                    boolean accepted=dispatchGesture(new GestureDescription.Builder().addStroke(new GestureDescription.StrokeDescription(path,0,duration)).build(),new GestureResultCallback(){@Override public void onCompleted(GestureDescription g){after(ticket,action,true,finish,180);}@Override public void onCancelled(GestureDescription g){finish.done(failure("手势被中断；请观察结果，不要自动重试"));}},main);if(!accepted)finish.done(failure("系统未接受手势"));return;
                }
                AccessibilityNodeInfo n=target(root,a);try{if(!n.isVisibleToUser()||!n.isEnabled())throw new IOException("目标当前不可操作");boolean ok;
                    if(action.equals("type")||action.equals("clear")){if(!n.isEditable())throw new IOException("目标不是可编辑输入框");String value=action.equals("clear")?"":a.getString("text");if(value.length()>16000)throw new IOException("输入超过 16000 字符");if(!action.equals("clear")&&!a.optBoolean("clear",true)){if(n.isPassword())throw new IOException("密码框不支持读取后追加，请替换输入或由用户输入");value=String.valueOf(n.getText()==null?"":n.getText())+value;}Bundle b=new Bundle();b.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,value);ok=n.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT,b);}
                    else if(action.equals("scroll"))ok=n.performAction(a.optString("direction","forward").equals("backward")?AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD:AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
                    else if(action.equals("click")||action.equals("long_click")){int act=action.equals("click")?AccessibilityNodeInfo.ACTION_CLICK:AccessibilityNodeInfo.ACTION_LONG_CLICK;AccessibilityNodeInfo click=AccessibilityNodeInfo.obtain(n);try{for(int i=0;i<5;i++){if((act==AccessibilityNodeInfo.ACTION_CLICK?click.isClickable():click.isLongClickable()))break;AccessibilityNodeInfo parent=click.getParent();if(parent==null)break;click.recycle();click=parent;}ok=click.performAction(act);}finally{click.recycle();}}
                    else throw new IOException("不支持的 App 操作");after(ticket,action,ok,finish,180);
                }finally{n.recycle();}
            }finally{root.recycle();}
        }catch(Exception e){operationId="";throw e;}
    }
    private void after(int ticket,String action,boolean accepted,Result finish,long delay){main.postDelayed(()->{if(!armed||generation!=ticket){finish.done(failure("操控已暂停，动作结果请检查；未自动重试"));return;}try{JSONObject r;try{r=observe();}catch(Exception e){r=new JSONObject().put("notice",e.getMessage());}r.put("ok",accepted).put("action",action).put("actionAccepted",accepted);if(!accepted)r.put("error","目标未接受该操作");finish.done(r);}catch(Exception e){finish.done(failure(e.getMessage()));}},delay);}
    private void verifyCapture(int ticket,JSONObject snapshot,int epoch)throws Exception{
        guard();if(generation!=ticket||scrollEpoch!=epoch)throw new IOException("截图期间界面已变化，请重新观察");
        AccessibilityNodeInfo root=foreground();try{DisplayMetrics d=screen();JSONObject viewport=snapshot.getJSONObject("viewport");if(!snapshot.getString("package").equals(String.valueOf(root.getPackageName()))||snapshot.getInt("window")!=root.getWindowId()||viewport.getInt("width")!=d.widthPixels||viewport.getInt("height")!=d.heightPixels)throw new IOException("截图期间 App 或屏幕已变化，请重新观察");}finally{root.recycle();}
    }
    private void screenshot(int ticket,JSONObject snapshot,int epoch,Result finish){
        takeScreenshot(Display.DEFAULT_DISPLAY,getMainExecutor(),new TakeScreenshotCallback(){
            public void onFailure(int code){finish.done(failure("系统截图未成功（"+code+"），受保护窗口不会绕过限制"));}
            public void onSuccess(ScreenshotResult result){
                try{verifyCapture(ticket,snapshot,epoch);}catch(Exception e){result.getHardwareBuffer().close();finish.done(failure(e.getMessage()));return;}
                // Pixel conversion, compression and disk writes must never block the UI thread.
                captures.execute(()->{
                    File file=null;Bitmap image=null,pixels=null;String error=null;
                    try{
                        image=Bitmap.wrapHardwareBuffer(result.getHardwareBuffer(),result.getColorSpace());if(image==null)throw new IOException("截图无法解码");
                        pixels=image.copy(Bitmap.Config.ARGB_8888,false);if(pixels==null)throw new IOException("截图像素无法读取");
                        File dir=new File(getCacheDir(),"app-captures");if(!dir.isDirectory()&&!dir.mkdirs())throw new IOException("无法创建截图目录");file=new File(dir,UUID.randomUUID()+".png");
                        try(OutputStream out=new FileOutputStream(file)){if(!pixels.compress(Bitmap.CompressFormat.PNG,100,out))throw new IOException("截图编码失败");}
                    }catch(Exception e){error=e.getMessage();}finally{if(pixels!=null)pixels.recycle();if(image!=null)image.recycle();result.getHardwareBuffer().close();}
                    final File saved=file;final String failed=error;
                    main.post(()->{boolean delivered=false;try{if(failed!=null)throw new IOException(failed);verifyCapture(ticket,snapshot,epoch);snapshot.put("captureFile",saved.getAbsolutePath());finish.done(snapshot);delivered=true;}catch(Exception e){finish.done(failure(e.getMessage()));}finally{if(!delivered&&saved!=null)saved.delete();}});
                });
            }
        });
    }
    private static JSONObject failure(String message){try{return new JSONObject().put("ok",false).put("error",message).put("executionState","unconfirmed");}catch(JSONException e){return new JSONObject();}}
}
