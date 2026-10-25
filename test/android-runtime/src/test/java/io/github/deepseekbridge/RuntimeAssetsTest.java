package io.github.deepseekbridge;

import android.app.Application;
import android.content.Context;
import android.content.res.AssetManager;
import java.io.*;
import org.json.JSONObject;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

/** Reads the same compiled APK assets as the installed app, with Android JSON/AssetManager. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class RuntimeAssetsTest {
    private File apk()throws IOException{return new File(System.getProperty("studio.testApk","../../build/resources.apk")).getCanonicalFile();}
    @Test public void realApkManifestLoadsAndArchiveOpens()throws Exception {
        Context context=RuntimeEnvironment.getApplication();
        File apk=apk();
        assertTrue(apk.toString(),apk.isFile());
        assertTrue(context.getAssets().addAssetPath(apk.getPath())>0);
        try(java.util.zip.ZipFile zip=new java.util.zip.ZipFile(apk)){java.util.Enumeration<? extends java.util.zip.ZipEntry> entries=zip.entries();while(entries.hasMoreElements())assertFalse("No Windows separators in raw APK entries",entries.nextElement().getName().contains("\\"));}
        JSONObject fromAndroid=new JSONObject(RuntimeInstaller.read(context.getAssets().open("runtime/manifest.json"),262144));
        context.getApplicationInfo().sourceDir=apk.getPath();
        RuntimeAssets assets=new RuntimeAssets(context);
        JSONObject manifest=new JSONObject(RuntimeInstaller.read(assets.open("manifest.json"),262144));
        assertEquals("arm64-v8a",manifest.getString("abi"));
        assertEquals(fromAndroid.getString("sha256"),manifest.getString("sha256"));
        try(InputStream in=assets.open("debian-arm64.tar.gz")) {
            assertEquals(0x1f,in.read());assertEquals(0x8b,in.read());
        }
        java.security.MessageDigest hash=java.security.MessageDigest.getInstance("SHA-256");long length=0;
        try(InputStream in=assets.open("debian-arm64.tar.gz")){byte[] bytes=new byte[131072];int count;while((count=in.read(bytes))!=-1){hash.update(bytes,0,count);length+=count;}}
        assertEquals(manifest.getLong("compressedBytes"),length);assertEquals(manifest.getString("sha256"),RuntimeInstaller.hex(hash.digest()));
        RuntimeInstaller installer=new RuntimeInstaller(context,state->{});
        assertNotNull(installer.status().toString(),installer.root());
        assertFalse(installer.status().toString(),installer.status().has("error"));
        assertEquals(11,installer.status().getJSONArray("tools").length());
        assertTrue(installer.status().toString(),assets.source().startsWith("installed APK"));
    }
    @Test public void legacyWindowsEntryReproducesTheFailureAndRecovers()throws Exception {
        Context context=RuntimeEnvironment.getApplication();File original=apk();File legacy=new File(context.getFilesDir(),"legacy-windows.apk");
        try(java.util.zip.ZipFile source=new java.util.zip.ZipFile(original);java.util.zip.ZipOutputStream out=new java.util.zip.ZipOutputStream(new FileOutputStream(legacy))){
            for(String name:new String[]{"resources.arsc","assets/runtime/manifest.json"}){
                java.util.zip.ZipEntry found=source.getEntry(name);if(found==null)found=source.getEntry(name.replace("runtime/","runtime\\"));
                out.putNextEntry(new java.util.zip.ZipEntry(name.replace("runtime/","runtime\\")));
                try(InputStream in=source.getInputStream(found)){byte[] bytes=new byte[8192];int count;while((count=in.read(bytes))!=-1)out.write(bytes,0,count);}out.closeEntry();
            }
        }
        assertTrue(context.getAssets().addAssetPath(legacy.getPath())>0);
        try(InputStream ignored=context.getAssets().open("runtime/manifest.json")){fail("Legacy nested asset is unreadable using the canonical Android name");}catch(FileNotFoundException expected){}
        context.getApplicationInfo().sourceDir=legacy.getPath();RuntimeInstaller installer=new RuntimeInstaller(context,value->{});
        assertNotNull(installer.root());assertFalse(installer.status().has("error"));assertEquals(11,installer.status().getJSONArray("tools").length());
    }
    @Test public void sameInstallerReloadsManifestAfterRecoverableReadFailure()throws Exception {
        Context context=RuntimeEnvironment.getApplication();
        context.getApplicationInfo().sourceDir=new File(context.getFilesDir(),"not-installed.apk").getPath();
        RuntimeInstaller installer=new RuntimeInstaller(context,state->{});
        assertEquals("manifest_unavailable",installer.status().getString("errorCode"));
        assertTrue(installer.status().getString("error").contains("manifest.json"));
        context.getApplicationInfo().sourceDir=apk().getCanonicalPath();
        org.robolectric.util.ReflectionHelpers.setStaticField(android.os.Build.class,"SUPPORTED_ABIS",new String[]{"arm64-v8a"});
        JSONObject manifest=new JSONObject(RuntimeInstaller.read(new RuntimeAssets(context).open("manifest.json"),262144));
        File root=new File(context.getFilesDir(),"environments/"+manifest.getString("id"));root.mkdirs();
        try(FileOutputStream out=new FileOutputStream(new File(root,".studio-image-ready"))){out.write(manifest.getString("sha256").getBytes("UTF-8"));}
        assertEquals(root.getCanonicalFile(),installer.ensure().getCanonicalFile());
        assertFalse(installer.status().toString(),installer.status().has("error"));
    }
    @Test public void failedObserverCannotDisableManifest()throws Exception {
        Context context=RuntimeEnvironment.getApplication();
        context.getApplicationInfo().sourceDir=apk().getCanonicalPath();
        RuntimeInstaller installer=new RuntimeInstaller(context,state->{throw new IllegalStateException("UI detached");});
        assertNotNull(installer.root());assertFalse(installer.status().has("error"));
        installer.setError("new failure");installer.booted();assertFalse(installer.status().has("error"));
    }
    @Test public void errorsReplaceStaleProgressAndStatusDoesNotWaitForInstallMonitor()throws Exception {
        Context context=RuntimeEnvironment.getApplication();
        context.getApplicationInfo().sourceDir=apk().getCanonicalPath();
        RuntimeInstaller installer=new RuntimeInstaller(context,state->{});
        java.lang.reflect.Method report=RuntimeInstaller.class.getDeclaredMethod("report",int.class,String.class);report.setAccessible(true);report.invoke(installer,15,"old progress");
        installer.setError("disk failure");assertEquals("disk failure",installer.status().getString("error"));assertFalse(installer.status().has("message"));assertFalse(installer.status().getBoolean("installing"));
        java.util.concurrent.ExecutorService worker=java.util.concurrent.Executors.newSingleThreadExecutor();
        try{synchronized(installer){assertEquals("disk failure",worker.submit(()->installer.status().optString("error")).get(1,java.util.concurrent.TimeUnit.SECONDS));}}finally{worker.shutdownNow();}
    }
}
