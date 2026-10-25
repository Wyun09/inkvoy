package io.github.deepseekbridge;

import android.app.Application;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.*;
import android.content.Intent;
import org.json.JSONObject;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import org.robolectric.android.controller.ServiceController;
import org.robolectric.android.controller.ActivityController;
import static org.junit.Assert.*;

/** Android framework classes + AOSP native SQLite, not a phone/emulator test. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
@SQLiteMode(SQLiteMode.Mode.NATIVE)
public class StartupRegressionTest {
    Context context;
    @Before public void setup(){context=RuntimeEnvironment.getApplication();context.deleteDatabase("studio-tool-journal.db");CrashDiagnostics.clear(context);}
    @Test public void oldInitializerReproducesAndroidCrash(){
        SQLiteDatabase db=context.openOrCreateDatabase("legacy-startup.db",0,null);
        try{db.execSQL("PRAGMA journal_mode=WAL");fail("Old startup statement must fail on Android");}
        catch(SQLiteException expected){assertTrue(expected.toString(),expected.getMessage().contains("Queries can be performed"));}
        finally{db.close();}
    }
    @Test public void journalOpensInWalAndRetainsCompletedFacts()throws Exception{
        ToolJournal journal=new ToolJournal(context);
        java.lang.reflect.Field field=ToolJournal.class.getDeclaredField("db");field.setAccessible(true);SQLiteDatabase db=(SQLiteDatabase)field.get(journal);
        assertTrue(db.isWriteAheadLoggingEnabled());
        db.beginTransaction();try(Cursor c=db.rawQuery("PRAGMA synchronous",null)){assertTrue(c.moveToFirst());assertEquals(2,c.getInt(0));}finally{db.endTransaction();}
        assertNull(journal.claim("native-call","same args"));journal.running("native-call");journal.finish("native-call",new JSONObject().put("ok",true).put("stdout","saved"));journal.close();
        journal=new ToolJournal(context);try{assertEquals("saved",journal.claim("native-call","same args").getString("stdout"));}finally{journal.close();}
    }
    @Test public void studioStartupDoesNotOpenDatabase(){
        StudioRuntime runtime=new StudioRuntime(context,event->{});
        try{assertFalse(context.getDatabasePath("studio-tool-journal.db").exists());}finally{runtime.close();}
    }
    public static class FailingService extends BridgeService {@Override protected BridgeRuntime createRuntime(){throw new IllegalStateException("controlled startup error");}}
    @Test public void serviceFailureIsRecordedAndCanBeDestroyed(){
        ServiceController<FailingService> controller=Robolectric.buildService(FailingService.class).create();
        try{FailingService service=controller.get();assertNull(service.runtime);assertTrue(service.startupFailure.contains("controlled startup error"));assertTrue(CrashDiagnostics.read(service).contains("service initialization"));assertEquals(android.app.Service.START_NOT_STICKY,service.onStartCommand(new Intent(),0,1));}
        finally{controller.destroy();}
    }
    @Test public void startupDiagnosticsRedactSecrets(){
        String secret="android-"+String.join("",java.util.Collections.nCopies(64,"a"));
        String report=CrashDiagnostics.record(context,"test",new IllegalArgumentException(secret+" Bearer private-token"));
        assertFalse(report.contains(secret));assertFalse(report.contains("private-token"));assertEquals(report,CrashDiagnostics.read(context));CrashDiagnostics.clear(context);assertEquals("",CrashDiagnostics.read(context));
    }
    private android.view.View text(android.view.View root,String value){if(root instanceof android.widget.TextView&&value.contentEquals(((android.widget.TextView)root).getText()))return root;if(root instanceof android.view.ViewGroup){android.view.ViewGroup group=(android.view.ViewGroup)root;for(int i=0;i<group.getChildCount();i++){android.view.View result=text(group.getChildAt(i),value);if(result!=null)return result;}}return null;}
    @Test public void previousFailureShowsNativeRecoveryPageAndCopiesDiagnostic(){
        CrashDiagnostics.record(context,"test",new IllegalStateException("previous startup failure"));
        ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup();
        try{android.view.View content=controller.get().findViewById(android.R.id.content);assertNotNull(text(content,"启动遇到问题"));android.view.View copy=text(content,"复制诊断");assertNotNull(copy);copy.performClick();android.content.ClipboardManager clipboard=(android.content.ClipboardManager)context.getSystemService(Context.CLIPBOARD_SERVICE);assertTrue(clipboard.getPrimaryClip().getItemAt(0).getText().toString().contains("previous startup failure"));}
        finally{controller.pause().stop().destroy();}
    }
}
