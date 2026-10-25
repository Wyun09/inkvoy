package io.github.deepseekbridge;

import android.app.Application;
import android.content.Context;
import android.view.View;
import android.widget.FrameLayout;
import android.webkit.WebView;
import java.io.File;
import java.lang.reflect.*;
import java.nio.file.Files;
import java.util.concurrent.*;
import javax.crypto.spec.SecretKeySpec;
import org.json.JSONObject;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import org.robolectric.android.controller.ActivityController;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class ResponsivenessTest {
    private EncryptedStateStore store() throws Exception { return new EncryptedStateStore(new File(RuntimeEnvironment.getApplication().getCacheDir(),"responsive-"+java.util.UUID.randomUUID()+".enc"),new SecretKeySpec(new byte[32],"AES")); }
    @Test public void uiStatusAndReadsDoNotWaitForWriterDiskLock() throws Exception {
        EncryptedStateStore encrypted=store();LocalState state=new LocalState(encrypted);assertTrue(state.save("{\"old\":true}"));
        ExecutorService workers=Executors.newFixedThreadPool(2);Future<Boolean> writer;
        try {
            synchronized(encrypted){writer=workers.submit(()->state.save("{\"new\":true}"));
                // The writer takes LocalState's write monitor before waiting on the
                // encrypted store; UI readers must remain independent of both.
                Future<String> reader=workers.submit(()->state.status()+state.load());
                assertTrue(reader.get(2,TimeUnit.SECONDS).contains("old"));
            }
            assertTrue(writer.get(3,TimeUnit.SECONDS));assertEquals("{\"new\":true}",state.load());
        }finally{workers.shutdownNow();}
    }
    @Test public void identicalSaveKeepsTheExistingCiphertextInsteadOfFsyncAgain() throws Exception {
        Context context=RuntimeEnvironment.getApplication();File file=new File(context.getCacheDir(),"dedupe-"+java.util.UUID.randomUUID()+".enc");
        EncryptedStateStore encrypted=new EncryptedStateStore(file,new SecretKeySpec(new byte[32],"AES"));LocalState state=new LocalState(encrypted);
        assertTrue(state.save("{\"same\":true}"));byte[] before=Files.readAllBytes(file.toPath());assertTrue(state.save("{\"same\":true}"));assertArrayEquals(before,Files.readAllBytes(file.toPath()));
        assertTrue(state.save("{\"changed\":true}"));assertFalse(java.util.Arrays.equals(before,Files.readAllBytes(file.toPath())));
    }
    public static class CountingWebView extends WebView {
        int boundsCalls,frontCalls;
        CountingWebView(Context context){super(context);}
        @Override public void setLayoutParams(android.view.ViewGroup.LayoutParams p){boundsCalls++;super.setLayoutParams(p);}
        @Override public void bringToFront(){frontCalls++;super.bringToFront();}
    }
    private void set(Object owner,String name,Object value)throws Exception{Field f=owner.getClass().getDeclaredField(name);f.setAccessible(true);f.set(owner,value);}
    @Test public void unchangedBrowserSlotDoesNotRepeatedlyLayoutOrReorderWebViews()throws Exception {
        Context context=RuntimeEnvironment.getApplication();CrashDiagnostics.record(context,"fixture",new Exception("controlled recovery screen"));
        ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup();BridgeRuntime runtime=new BridgeRuntime(context);
        try{
            MainActivity activity=controller.get();BridgeService service=Robolectric.buildService(BridgeService.class).get();service.runtime=runtime;set(activity,"service",service);
            FrameLayout root=new FrameLayout(activity);root.layout(0,0,390,844);set(activity,"root",root);
            runtime.browser.destroy();runtime.engine.destroy();CountingWebView web=new CountingWebView(activity),ui=new CountingWebView(activity);runtime.browser=web;runtime.engine=ui;
            root.addView(web,new FrameLayout.LayoutParams(390,700));root.addView(ui,new FrameLayout.LayoutParams(390,844));ui.layout(0,0,390,844);
            runtime.uiLayout=new JSONObject().put("visible",true).put("viewportWidth",390).put("left",0).put("top",56).put("width",390).put("height",700);
            Method apply=MainActivity.class.getDeclaredMethod("applyBrowserLayout");apply.setAccessible(true);apply.invoke(activity);web.boundsCalls=0;web.frontCalls=0;
            for(int i=0;i<100;i++)apply.invoke(activity);assertEquals(0,web.boundsCalls);assertEquals(0,web.frontCalls);
            runtime.uiLayout=new JSONObject().put("visible",false);apply.invoke(activity);ui.frontCalls=0;
            for(int i=0;i<100;i++)apply.invoke(activity);assertEquals(0,ui.frontCalls);
        }finally{set(controller.get(),"service",null);runtime.destroy();controller.pause().stop().destroy();CrashDiagnostics.clear(context);}
    }
}
