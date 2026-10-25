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
        final List<Integer> actions=new ArrayList<>(),sources=new ArrayList<>(),buttons=new ArrayList<>();float lastX,lastY;String committed="",evaluation="{}",selection="";boolean selected;int deletedBefore,deletedAfter;
        RecordingWebView(Context c){super(c);}
        @Override public boolean dispatchTouchEvent(MotionEvent event){actions.add(event.getAction());sources.add(event.getSource());buttons.add(event.getButtonState());lastX=event.getX();lastY=event.getY();return true;}
        @Override public void evaluateJavascript(String script,ValueCallback<String> reply){if(reply!=null)reply.onReceiveValue(evaluation);}
        @Override public InputConnection onCreateInputConnection(EditorInfo info){return new BaseInputConnection(this,false){@Override public boolean commitText(CharSequence value,int position){committed=value.toString();return true;}@Override public boolean performContextMenuAction(int id){selected=id==android.R.id.selectAll;return true;}@Override public CharSequence getSelectedText(int flags){return selection;}@Override public boolean deleteSurroundingTextInCodePoints(int before,int after){deletedBefore=before;deletedAfter=after;return true;}};}
    }
    @Test public void clickDispatchesRealMouseSourceAndPrimaryButtonAtTheRequestedPosition()throws Exception{
        browser.surface();RecordingWebView web=new RecordingWebView(context);field(browser,"web",web);try{Method touch=ComputerBrowser.class.getDeclaredMethod("touch",int.class,float.class,float.class);touch.setAccessible(true);touch.invoke(browser,MotionEvent.ACTION_DOWN,123f,234f);touch.invoke(browser,MotionEvent.ACTION_UP,123f,234f);assertEquals(Arrays.asList(MotionEvent.ACTION_DOWN,MotionEvent.ACTION_UP),web.actions);assertEquals(InputDevice.SOURCE_MOUSE,(int)web.sources.get(0));assertEquals(MotionEvent.BUTTON_PRIMARY,(int)web.buttons.get(0));assertEquals(0,(int)web.buttons.get(1));assertEquals(123,web.lastX,0);assertEquals(234,web.lastY,0);}finally{web.destroy();}
    }
    @Test public void typingUsesTheFocusedNativeInputConnectionAndOptionalSelectAll()throws Exception{
        browser.surface();RecordingWebView web=new RecordingWebView(context);field(browser,"web",web);field(browser,"observation","current");Method perform=ComputerBrowser.class.getDeclaredMethod("execute",JSONObject.class,int.class,StudioRuntime.Reply.class);perform.setAccessible(true);
        try{ComputerBrowser.applyEdit(new JSONObject().put("action","type").put("text","中文输入 OK").put("clear",true),web);assertEquals("中文输入 OK",web.committed);assertTrue(web.selected);assertEquals(KeyEvent.KEYCODE_ENTER,ComputerBrowser.keyCode("Enter"));assertEquals(-1,ComputerBrowser.keyCode("LAUNCH_NATIVE_APP"));}finally{web.destroy();}
    }
    @Test public void aFreshTokenStillRequiresTheCurrentViewportAndControlsToMatch()throws Exception{
        browser.surface();RecordingWebView web=new RecordingWebView(context);field(browser,"web",web);field(browser,"observation","latest");JSONObject original=new JSONObject().put("url","https://example.com").put("viewport",new JSONObject().put("width",390)).put("elements",new JSONArray());field(browser,"signature",ComputerBrowser.signatureOf(original));field(browser,"lastPage",original);web.evaluation=new JSONObject(original.toString()).put("viewport",new JSONObject().put("width",800)).toString();
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
    static JSONObject page(String label,int x)throws Exception{return new JSONObject().put("url","https://example.com/").put("viewport",new JSONObject().put("width",390).put("height",600)).put("elements",new JSONArray().put(new JSONObject().put("ref","e1").put("role","input").put("label","Account").put("editable",true).put("x",x).put("y",100).put("bounds",new JSONArray("[10,80,200,40]"))).put(new JSONObject().put("ref","e2").put("label",label))).put("focused",new JSONObject().put("ref","e1").put("editable",true));}
    @Test public void movingTargetRefSurvivesUnrelatedDynamicLabelsButNotTargetChanges()throws Exception{
        JSONObject old=page("Countdown 25",40),live=page("Countdown 24",60),a=new JSONObject().put("action","click").put("ref","e1");
        assertEquals(60,ComputerBrowser.validateAction(a,old,live).getInt("x"));
        live.getJSONArray("elements").getJSONObject(0).put("label","Different field");
        try{ComputerBrowser.validateAction(a,old,live);fail("Changed target accepted");}catch(java.io.IOException expected){}
    }
    @Test public void editingCannotFollowAnUnexpectedFocusChange()throws Exception{
        JSONObject old=page("Old",40),live=page("New",40);live.put("focused",new JSONObject().put("ref","e2").put("editable",true));
        try{ComputerBrowser.validateAction(new JSONObject().put("action","type"),old,live);fail("Wrong focused field accepted");}catch(java.io.IOException expected){}
        assertEquals("e1",ComputerBrowser.validateAction(new JSONObject().put("action","type").put("ref","e1"),old,live).getString("ref"));
    }
    @Test public void humanInteractionInvalidatesOnlyTheCurrentStepAndKeepsCursorAndPermission()throws Exception{
        browser.surface();browser.setVisible(true);assertTrue(browser.state().getBoolean("pointerVisible"));
        field(browser,"observation","current");browser.humanActivity();assertTrue(browser.state().getBoolean("enabled"));assertTrue(browser.state().getBoolean("humanActive"));assertEquals("",field(browser,"observation"));
        browser.takeOver();assertFalse(browser.state().getBoolean("enabled"));assertFalse(browser.state().getBoolean("pointerVisible"));
    }
    @Test public void deletionSupportsUnicodeCaretDirectionsSelectionAndWholeFieldClear()throws Exception{
        RecordingWebView web=new RecordingWebView(context);try{
            ComputerBrowser.applyEdit(new JSONObject().put("action","delete").put("count",2),web);assertEquals(2,web.deletedBefore);assertEquals(0,web.deletedAfter);
            ComputerBrowser.applyEdit(new JSONObject().put("action","delete").put("count",3).put("direction","forward"),web);assertEquals(0,web.deletedBefore);assertEquals(3,web.deletedAfter);
            web.selection="selected";web.committed="unchanged";ComputerBrowser.applyEdit(new JSONObject().put("action","delete"),web);assertEquals("",web.committed);
            ComputerBrowser.applyEdit(new JSONObject().put("action","clear"),web);assertTrue(web.selected);assertEquals("",web.committed);
            assertEquals(KeyEvent.KEYCODE_FORWARD_DEL,ComputerBrowser.keyCode("Delete"));
        }finally{web.destroy();}
    }
    @Test public void pinchZoomIsEnabledWithoutFloatingNativeButtons()throws Exception{
        browser.surface();WebSettings settings=((WebView)field(browser,"web")).getSettings();assertTrue(settings.supportZoom());assertTrue(settings.getBuiltInZoomControls());assertFalse(settings.getDisplayZoomControls());
    }
    @Test public void anUncommittedNavigationCannotReturnThePreviousPageAsSuccess()throws Exception{
        browser.surface();field(browser,"navigationPending",true);boolean[] rejected={false};
        Method wait=ComputerBrowser.class.getDeclaredMethod("waitLoaded",int.class,StudioRuntime.Reply.class,int.class);wait.setAccessible(true);
        wait.invoke(browser,0,(StudioRuntime.Reply)(ok,value)->{assertFalse(ok);assertTrue(String.valueOf(value).contains("导航尚未提交"));rejected[0]=true;},55);assertTrue(rejected[0]);
    }
    @Test public void navigationWaitsForCommitRatherThanJustTheStartCallback()throws Exception{
        browser.surface();WebView web=(WebView)field(browser,"web");String url="https://example.com/";web.loadUrl(url);
        web.getWebViewClient().onPageStarted(web,url,null);assertTrue((Boolean)field(browser,"navigationPending"));
        web.getWebViewClient().onPageCommitVisible(web,"https://previous.example/");assertTrue((Boolean)field(browser,"navigationPending"));
        web.getWebViewClient().onPageCommitVisible(web,url);assertFalse((Boolean)field(browser,"navigationPending"));
    }

}
