package io.github.deepseekbridge;

import android.app.Application;
import android.content.Context;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.view.inputmethod.BaseInputConnection;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.webkit.WebView;
import org.json.JSONObject;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowWebView;
import java.lang.reflect.Field;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Exercises the production PageWebView wrapper, not just humanActivity(). */
@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class,shadows=BrowserImeRegressionTest.ImeWebViewShadow.class)
@SQLiteMode(SQLiteMode.Mode.NATIVE)
public class BrowserImeRegressionTest {
    @Implements(WebView.class)
    public static class ImeWebViewShadow extends ShadowWebView {
        static InputConnection connection;
        @Implementation protected InputConnection onCreateInputConnection(EditorInfo info){return connection;}
    }

    ComputerBrowser browser;
    HandlerThread inputThread;
    Handler inputHandler;
    final List<JSONObject> states=new ArrayList<>();

    @Before public void setup(){
        Context context=RuntimeEnvironment.getApplication();
        browser=new ComputerBrowser(context,new ComputerBrowser.Listener(){
            public void changed(JSONObject state){assertSame("UI notification escaped to the input thread",Looper.getMainLooper(),Looper.myLooper());states.add(state);}
            public void reveal(){}
        });
        browser.surface();
        inputThread=new HandlerThread("InputConnectionHandlerThread");inputThread.start();inputHandler=new Handler(inputThread.getLooper());
    }
    @After public void cleanup()throws Exception{ImeWebViewShadow.connection=null;browser.close();inputThread.quitSafely();inputThread.join(3000);}

    static Object field(Object object,String name)throws Exception{Field f=object.getClass().getDeclaredField(name);f.setAccessible(true);return f.get(object);}
    static void field(Object object,String name,Object value)throws Exception{Field f=object.getClass().getDeclaredField(name);f.setAccessible(true);f.set(object,value);}
    void onInputThread(Runnable task)throws Exception{
        CountDownLatch done=new CountDownLatch(1);AtomicReference<Throwable> failure=new AtomicReference<>();
        inputHandler.post(()->{try{task.run();}catch(Throwable error){failure.set(error);}finally{done.countDown();}});
        assertTrue("IME callback blocked",done.await(3,TimeUnit.SECONDS));
        if(failure.get()!=null)throw new AssertionError("IME callback failed",failure.get());
    }
    InputConnection wrapper(final List<String> forwarded)throws Exception{
        WebView page=(WebView)field(browser,"web");
        ImeWebViewShadow.connection=new BaseInputConnection(page,false){
            void record(String text){assertSame("Chromium input connection moved away from its input thread",inputThread.getLooper(),Looper.myLooper());forwarded.add(text);}
            @Override public Handler getHandler(){return inputHandler;}
            @Override public boolean beginBatchEdit(){record("begin");return true;}
            @Override public boolean endBatchEdit(){record("end");return true;}
            @Override public boolean setComposingText(CharSequence text,int cursor){record("compose:"+text);return true;}
            @Override public boolean commitText(CharSequence text,int cursor){record("commit:"+text);return true;}
            @Override public boolean deleteSurroundingText(int before,int after){record("delete:"+before+":"+after);return true;}
            @Override public boolean deleteSurroundingTextInCodePoints(int before,int after){record("codepoints:"+before+":"+after);return true;}
        };
        InputConnection wrapper=page.onCreateInputConnection(new EditorInfo());assertNotNull(wrapper);assertNotSame(ImeWebViewShadow.connection,wrapper);return wrapper;
    }

    @Test public void manualChineseCompositionCommitAndDeletionPreserveTheInputThread()throws Exception{
        List<String> forwarded=new ArrayList<>();InputConnection connection=wrapper(forwarded);
        assertSame(inputHandler,connection.getHandler());field(browser,"observation","current");
        onInputThread(()->{
            assertTrue(connection.beginBatchEdit());
            assertTrue(connection.setComposingText("ni",1));
            assertTrue(connection.setComposingText("你好",1));
            assertTrue(connection.commitText("你好 👋",1));
            assertTrue(connection.deleteSurroundingText(1,0));
            assertTrue(connection.deleteSurroundingTextInCodePoints(1,0));
            assertTrue(connection.endBatchEdit());
        });
        assertEquals(Arrays.asList("begin","compose:ni","compose:你好","commit:你好 👋","delete:1:0","codepoints:1:0","end"),forwarded);
        Shadows.shadowOf(Looper.getMainLooper()).idle();
        assertEquals("",field(browser,"observation"));assertTrue(browser.state().getBoolean("enabled"));assertTrue(states.size()>0);
    }

    @Test public void rapidTypingAndHoldingBackspaceNeverPublishWebViewStateFromImeThread()throws Exception{
        List<String> forwarded=new ArrayList<>();InputConnection connection=wrapper(forwarded);
        onInputThread(()->{for(int i=0;i<50;i++){assertTrue(connection.commitText("字",1));assertTrue(connection.deleteSurroundingText(1,0));}});
        assertEquals(100,forwarded.size());Shadows.shadowOf(Looper.getMainLooper()).idle();
        assertEquals(100,states.size());assertTrue(browser.state().getBoolean("enabled"));
    }

    @Test public void lateImeNotificationAfterBrowserCloseDoesNotEmitOrReadDestroyedWebView()throws Exception{
        List<String> forwarded=new ArrayList<>();InputConnection connection=wrapper(forwarded);
        onInputThread(()->assertTrue(connection.commitText("last",1)));
        browser.close();Shadows.shadowOf(Looper.getMainLooper()).idle();assertEquals(0,states.size());
    }
}
