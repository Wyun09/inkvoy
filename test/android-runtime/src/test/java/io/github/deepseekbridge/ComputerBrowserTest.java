package io.github.deepseekbridge;
import android.app.Application;
import android.content.Context;
import android.view.*;
import android.view.inputmethod.*;
import android.webkit.*;
import android.widget.FrameLayout;
import org.json.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
@SQLiteMode(SQLiteMode.Mode.NATIVE)
public class ComputerBrowserTest {
    Context context;ComputerBrowser browser;
    @Before public void setup(){context=RuntimeEnvironment.getApplication();browser=new ComputerBrowser(context,new ComputerBrowser.Listener(){public void changed(JSONObject state){}public void reveal(){}});}
    @After public void cleanup(){browser.close();}
    static void field(Object target,String key,Object value)throws Exception{Field f=target.getClass().getDeclaredField(key);f.setAccessible(true);f.set(target,value);}
    static Object field(Object target,String key)throws Exception{Field f=target.getClass().getDeclaredField(key);f.setAccessible(true);return f.get(target);}
    @Test public void navigationAllowsOrdinaryAndLocalPagesButRejectsNativeAndCredentialUrls()throws Exception{
        for(String value:new String[]{"https://example.com/path","http://127.0.0.1:5173","https://chat.deepseek.com"})assertTrue(value,ComputerBrowser.allowedUrl(value));
        for(String value:new String[]{"file:///data/private","content://private","javascript:alert(1)","https://bridge.local/engine.html","https://BRIDGE.LOCAL/browser-capture/a.jpg","https://user:password@example.com"})assertFalse(value,ComputerBrowser.allowedUrl(value));
        assertEquals("http://localhost:5173",ComputerBrowser.normalizeUrl("localhost:5173"));assertEquals("https://example.com",ComputerBrowser.normalizeUrl("example.com"));
    }
    @Test public void surfaceHasNoFileAccessAndDoesNotReplaceTheModelWebView()throws Exception{
        FrameLayout surface=browser.surface();WebView web=(WebView)field(browser,"web");assertSame(web,surface.getChildAt(0));assertEquals(2,surface.getChildCount());assertFalse(web.getSettings().getAllowFileAccess());assertFalse(web.getSettings().getAllowContentAccess());assertEquals(WebSettings.MIXED_CONTENT_NEVER_ALLOW,web.getSettings().getMixedContentMode());
        WebView modelPage=new WebView(context);try{assertNotSame(modelPage,web);browser.takeOver();assertFalse(browser.state().getBoolean("enabled"));assertNull(modelPage.getUrl());}finally{modelPage.destroy();}
    }
    @Test public void coordinatesAndStaleObservationsCannotDispatchClicks()throws Exception{
        assertEquals(42,ComputerBrowser.coordinate(new JSONObject().put("x",42),"x",390),0);
        for(JSONObject a:new JSONObject[]{new JSONObject(),new JSONObject().put("x",-1),new JSONObject().put("x",390)})try{ComputerBrowser.coordinate(a,"x",390);fail("Invalid coordinates accepted");}catch(java.io.IOException expected){}
        browser.surface();field(browser,"observation","current");final boolean[] rejected={false};Method perform=ComputerBrowser.class.getDeclaredMethod("perform",JSONObject.class,int.class,StudioRuntime.Reply.class);perform.setAccessible(true);
        perform.invoke(browser,new JSONObject().put("action","click").put("observation","old").put("x",20).put("y",20),0,(StudioRuntime.Reply)(ok,value)->{assertFalse(ok);assertTrue(String.valueOf(value).contains("过期"));rejected[0]=true;});assertTrue(rejected[0]);
        browser.takeOver();rejected[0]=false;perform.invoke(browser,new JSONObject().put("action","click").put("observation","current").put("x",20).put("y",20),0,(StudioRuntime.Reply)(ok,value)->{assertFalse(ok);assertTrue(String.valueOf(value).contains("接管"));rejected[0]=true;});assertTrue(rejected[0]);
    }
    public static class RecordingWebView extends WebView {
        final List<Integer> actions=new ArrayList<>(),sources=new ArrayList<>(),buttons=new ArrayList<>();float lastX,lastY;String committed="",evaluation="{}";boolean selected;
        RecordingWebView(Context c){super(c);}
        @Override public boolean dispatchTouchEvent(MotionEvent event){actions.add(event.getAction());sources.add(event.getSource());buttons.add(event.getButtonState());lastX=event.getX();lastY=event.getY();return true;}
        @Override public void evaluateJavascript(String script,ValueCallback<String> reply){if(reply!=null)reply.onReceiveValue(evaluation);}
        @Override public InputConnection onCreateInputConnection(EditorInfo info){return new BaseInputConnection(this,false){@Override public boolean commitText(CharSequence value,int position){committed=value.toString();return true;}@Override public boolean performContextMenuAction(int id){selected=id==android.R.id.selectAll;return true;}};}
    }
    @Test public void clickDispatchesRealMouseSourceAndPrimaryButtonAtTheRequestedPosition()throws Exception{
        browser.surface();RecordingWebView web=new RecordingWebView(context);field(browser,"web",web);try{Method touch=ComputerBrowser.class.getDeclaredMethod("touch",int.class,float.class,float.class);touch.setAccessible(true);touch.invoke(browser,MotionEvent.ACTION_DOWN,123f,234f);touch.invoke(browser,MotionEvent.ACTION_UP,123f,234f);assertEquals(Arrays.asList(MotionEvent.ACTION_DOWN,MotionEvent.ACTION_UP),web.actions);assertEquals(InputDevice.SOURCE_MOUSE,(int)web.sources.get(0));assertEquals(MotionEvent.BUTTON_PRIMARY,(int)web.buttons.get(0));assertEquals(0,(int)web.buttons.get(1));assertEquals(123,web.lastX,0);assertEquals(234,web.lastY,0);}finally{web.destroy();}
    }
    @Test public void typingUsesTheFocusedNativeInputConnectionAndOptionalSelectAll()throws Exception{
        browser.surface();RecordingWebView web=new RecordingWebView(context);field(browser,"web",web);field(browser,"observation","current");Method perform=ComputerBrowser.class.getDeclaredMethod("execute",JSONObject.class,int.class,StudioRuntime.Reply.class);perform.setAccessible(true);
        try{perform.invoke(browser,new JSONObject().put("action","type").put("observation","current").put("text","中文输入 OK").put("clear",true),0,(StudioRuntime.Reply)(ok,value)->{});assertEquals("中文输入 OK",web.committed);assertTrue(web.selected);assertEquals(KeyEvent.KEYCODE_ENTER,ComputerBrowser.keyCode("Enter"));assertEquals(-1,ComputerBrowser.keyCode("LAUNCH_NATIVE_APP"));}finally{web.destroy();}
    }
    @Test public void aFreshTokenStillRequiresTheCurrentViewportAndControlsToMatch()throws Exception{
        browser.surface();RecordingWebView web=new RecordingWebView(context);field(browser,"web",web);field(browser,"observation","latest");JSONObject original=new JSONObject().put("url","https://example.com").put("viewport",new JSONObject().put("width",390)).put("elements",new JSONArray());field(browser,"signature",ComputerBrowser.signatureOf(original));web.evaluation=new JSONObject(original.toString()).put("viewport",new JSONObject().put("width",800)).toString();
        boolean[] rejected={false};Method perform=ComputerBrowser.class.getDeclaredMethod("perform",JSONObject.class,int.class,StudioRuntime.Reply.class);perform.setAccessible(true);try{perform.invoke(browser,new JSONObject().put("action","click").put("observation","latest").put("x",20).put("y",20),0,(StudioRuntime.Reply)(ok,value)->{assertFalse(ok);assertTrue(String.valueOf(value).contains("变化"));rejected[0]=true;});assertTrue(rejected[0]);assertTrue(web.actions.isEmpty());}finally{web.destroy();}
    }
    @Test public void browserActionsUseTheSameDurableDeduplicationAsOtherTools()throws Exception{
        context.deleteDatabase("studio-tool-journal.db");StudioRuntime runtime=new StudioRuntime(context,event->{});java.util.concurrent.atomic.AtomicInteger count=new java.util.concurrent.atomic.AtomicInteger();runtime.browserTool=new StudioRuntime.BrowserTool(){public JSONObject run(String id,JSONObject args)throws Exception{count.incrementAndGet();return new JSONObject().put("ok",true).put("observation","fixture");}public void cancel(){}};
        JSONObject args=new JSONObject().put("id","browser-durable").put("project","browser-fixture").put("name","browser").put("args",new JSONObject().put("action","observe"));
        try{for(int i=0;i<2;i++){CountDownLatch done=new CountDownLatch(1);runtime.request("tool.execute",args,(ok,value)->{assertTrue(ok);done.countDown();});assertTrue(done.await(4,TimeUnit.SECONDS));}assertEquals(1,count.get());}finally{runtime.close();}
    }
    @Test public void capturePathsStayPrivateAndMissingImagesAreExplicit()throws Exception{
        for(String id:new String[]{"../token","x/../../key","https://evil/image",""})try{browser.captureFile(id);fail("Accepted unsafe capture path");}catch(java.io.IOException expected){}
        try{browser.image("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");fail("Missing capture accepted");}catch(java.io.IOException expected){assertTrue(expected.getMessage().contains("过期"));}
    }
}
