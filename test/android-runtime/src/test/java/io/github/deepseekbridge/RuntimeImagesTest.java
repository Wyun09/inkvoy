package io.github.deepseekbridge;

import android.app.Application;
import android.content.Context;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;
import org.json.JSONObject;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class RuntimeImagesTest {
    private Context context;
    private byte[] payload;
    private JSONObject manifest;
    @Before public void setup()throws Exception {
        context=RuntimeEnvironment.getApplication();payload=new byte[400000];new Random(52).nextBytes(payload);
        manifest=new JSONObject().put("id","fixture-image").put("sha256",RuntimeInstaller.hex(MessageDigest.getInstance("SHA-256").digest(payload)))
            .put("compressedBytes",payload.length).put("unpackedBytes",800000).put("abi","arm64-v8a").put("tools",new org.json.JSONArray());
    }
    private File incoming()throws Exception {File target=RuntimeImages.image(context,manifest);return new File(target.getParentFile(),target.getName()+".incoming");}
    private void reject(InputStream input)throws Exception {
        try{RuntimeImages.importImage(context,manifest,input,null);fail("Invalid image accepted");}catch(IOException expected){}
        assertFalse("Partial image must be discarded",incoming().exists());
    }
    @Test public void acceptedImageIsByteExactAndReportedAvailableWithoutBundledArchive()throws Exception {
        File apk=new File(context.getFilesDir(),"lite-fixture.apk");
        try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(apk))){out.putNextEntry(new ZipEntry("assets/runtime/manifest.json"));out.write(manifest.toString().getBytes("UTF-8"));out.closeEntry();}
        context.getApplicationInfo().sourceDir=apk.getPath();RuntimeAssets assets=new RuntimeAssets(context);
        assertFalse(assets.imageAvailable());
        RuntimeInstaller installer=new RuntimeInstaller(context,state->{});assertFalse(installer.status().getBoolean("imageAvailable"));
        JSONObject status=installer.importImage(new ByteArrayInputStream(payload));assertTrue(status.getBoolean("imageAvailable"));assertFalse(status.getBoolean("ready"));assertFalse(status.getBoolean("installing"));
        assertTrue(assets.imageAvailable());assertArrayEquals(payload,Files.readAllBytes(RuntimeImages.image(context,manifest).toPath()));assertFalse(incoming().exists());
        try(InputStream in=assets.open("debian-arm64.tar.gz")){assertEquals(payload[0]&255,in.read());}assertTrue(assets.source().startsWith("verified imported image"));
    }
    @Test public void truncatedOversizedAndWrongHashInputsCannotReplaceAnAcceptedImage()throws Exception {
        File accepted=RuntimeImages.importImage(context,manifest,new ByteArrayInputStream(payload),null);
        reject(new ByteArrayInputStream(Arrays.copyOf(payload,payload.length-1)));
        reject(new ByteArrayInputStream(Arrays.copyOf(payload,payload.length+1)));
        byte[] corrupt=payload.clone();corrupt[123]^=1;reject(new ByteArrayInputStream(corrupt));
        assertArrayEquals(payload,Files.readAllBytes(accepted.toPath()));
    }
    @Test public void readFailureDiscardsPartialImageAndLeavesNoAvailableCache()throws Exception {
        reject(new InputStream(){int calls;public int read()throws IOException{throw new IOException("provider lost access");}public int read(byte[] b,int off,int len)throws IOException{if(calls++>0)throw new IOException("provider lost access");System.arraycopy(payload,0,b,off,100);return 100;}});
        assertFalse(RuntimeImages.image(context,manifest).exists());
    }
    @Test public void cancellationDiscardsThePartialImage()throws Exception {
        Thread.currentThread().interrupt();try{reject(new ByteArrayInputStream(payload));}finally{Thread.interrupted();}
        assertFalse(RuntimeImages.image(context,manifest).exists());
    }
    @Test public void completionProgressReachesExactPinnedLength()throws Exception {
        List<Long> counts=new ArrayList<>();RuntimeImages.importImage(context,manifest,new ByteArrayInputStream(payload),(done,total)->{assertEquals(payload.length,total);counts.add(done);});
        assertEquals((long)payload.length,(long)counts.get(counts.size()-1));assertTrue("Small reads must not flood UI events",counts.size()<=3);
    }
    @Test public void malformedDigestNeverCreatesAPath()throws Exception {
        manifest.put("sha256","../../outside");try{RuntimeImages.image(context,manifest);fail("Untrusted path accepted");}catch(IOException expected){}
    }
    @Test public void symlinkCacheCannotRedirectTheImport()throws Exception {
        File target=RuntimeImages.image(context,manifest),outside=new File(context.getCacheDir(),"outside.tar.gz");Files.write(outside.toPath(),new byte[]{7});target.getParentFile().mkdirs();
        try{Files.createSymbolicLink(target.toPath(),outside.toPath());}catch(FileSystemException|UnsupportedOperationException e){Assume.assumeNoException("Host does not permit symlinks",e);}
        try{RuntimeImages.importImage(context,manifest,new ByteArrayInputStream(payload),null);fail("Symlink target accepted");}catch(IOException expected){}
        assertArrayEquals(new byte[]{7},Files.readAllBytes(outside.toPath()));
    }
}
