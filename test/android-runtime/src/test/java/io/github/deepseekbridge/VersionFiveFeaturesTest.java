package io.github.deepseekbridge;
import android.app.*;
import android.os.Build;
import android.view.*;
import java.net.*;
import java.io.*;
import javax.net.ssl.SSLException;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class VersionFiveFeaturesTest {
 @Test public void fullscreenCanBeAppliedBeforeActivityContentOrWindowAttachment(){
  Activity a=Robolectric.buildActivity(Activity.class).create().get();try{DisplayMode.applyFullscreen(a);assertTrue(DisplayMode.fullscreen(a));assertNotNull(a.getWindow().getDecorView());assertFalse(a.isFinishing());}finally{a.finish();}
 }
 @Test public void immersivePreferenceDefaultsOnAndTogglesWithoutFinishingTheActivity(){
  Activity a=Robolectric.buildActivity(Activity.class).setup().get();try{
   a.getSharedPreferences("studio-display",0).edit().clear().commit();assertTrue(DisplayMode.fullscreen(a));DisplayMode.applyFullscreen(a);
   if(Build.VERSION.SDK_INT<30)assertTrue((a.getWindow().getDecorView().getSystemUiVisibility()&View.SYSTEM_UI_FLAG_FULLSCREEN)!=0);
   if(Build.VERSION.SDK_INT>=28)assertEquals(WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES,a.getWindow().getAttributes().layoutInDisplayCutoutMode);
   DisplayMode.fullscreen(a,false);assertFalse(DisplayMode.fullscreen(a));DisplayMode.set(a,"landscape");assertFalse(DisplayMode.fullscreen(a));
   if(Build.VERSION.SDK_INT<30)assertEquals(0,a.getWindow().getDecorView().getSystemUiVisibility()&View.SYSTEM_UI_FLAG_FULLSCREEN);
   DisplayMode.fullscreen(a,true);assertTrue(DisplayMode.fullscreen(a));assertFalse(a.isFinishing());assertEquals("landscape",DisplayMode.get(a));
  }finally{a.finish();}
 }
 @Test public void nestedNetworkFailuresKeepTheirOwnCategoryAndDoNotAskForNewAuthorization(){
  Throwable dns=new IOException("wrapper",new UnknownHostException("private data"));assertEquals("dns_resolution",NetworkErrors.code(dns));
  String message=NetworkErrors.message(dns,"api.openai.com");assertTrue(message.contains("api.openai.com"));assertTrue(message.contains("无需重新登录"));assertFalse(message.contains("private data"));
  assertEquals("network_timeout",NetworkErrors.code(new SocketTimeoutException()));assertEquals("tls_failure",NetworkErrors.code(new SSLException("secret")));assertEquals("network_unreachable",NetworkErrors.code(new ConnectException()));assertEquals("provider_error",NetworkErrors.code(new IOException()));
 }
 @Test public void scriptAssemblyPreservesSourceAndValidatesTemplateAndSize()throws Exception{
  String template="var key=__INKVOY_SCRIPT_KEY__; async function run(){__INKVOY_SCRIPT_BODY__}";
  String script="const field=document.querySelector('input'); field.value='a'; return await Promise.resolve(field.value);";
  String built=BrowserScripts.source(template,script,"safe-key");assertTrue(built.contains(script));assertTrue(built.contains("\"safe-key\""));assertFalse(built.contains("__INKVOY_SCRIPT_BODY__"));
  for(String invalid:new String[]{"",null,new String(new char[32769]).replace('\0','x')})try{BrowserScripts.source(template,invalid,"key");fail();}catch(IOException expected){}
  try{BrowserScripts.source("missing",script,"key");fail();}catch(IOException expected){}
  assertEquals("AI 正在执行网页脚本",ComputerBrowser.actionLabel("script"));
 }
 @Test public void signedApkContainsTheBoundedScriptRunner()throws Exception{
  File apk=new File(System.getProperty("studio.testApk","../../build/resources.apk")).getCanonicalFile();
  try(java.util.zip.ZipFile zip=new java.util.zip.ZipFile(apk)){String script=RuntimeInstaller.read(zip.getInputStream(zip.getEntry("assets/browser-script.js")),65536);assertTrue(script.contains("__INKVOY_SCRIPT_BODY__"));assertTrue(script.contains("__INKVOY_SCRIPT_KEY__"));assertTrue(script.contains("48000"));assertFalse(script.contains("eval("));}
 }
}
