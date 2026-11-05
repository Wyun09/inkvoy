package io.github.deepseekbridge;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.res.AssetManager;
import java.io.*;
import java.util.*;
import java.util.zip.*;

/** Streams bundled assets or a separately imported, pinned image without loading it into RAM. */
final class RuntimeAssets {
    private final Context context;
    private volatile String source="not opened";
    RuntimeAssets(Context context){this.context=context;}
    String source(){return source;}
    boolean imageAvailable(){try(InputStream ignored=open("debian-arm64.tar.gz")){return true;}catch(Exception e){return false;}}
    InputStream open(String name)throws IOException {
        if(!name.equals("manifest.json")&&!name.equals("debian-arm64.tar.gz"))throw new IOException("Unknown runtime asset");
        if(name.equals("debian-arm64.tar.gz"))try{
            org.json.JSONObject manifest=new org.json.JSONObject(RuntimeInstaller.read(open("manifest.json"),262144));
            File cached=RuntimeImages.image(context,manifest);
            if(cached.isFile()&&cached.length()==manifest.getLong("compressedBytes")){source="verified imported image / "+cached.getName();return new FileInputStream(cached);}
        }catch(Exception ignored){/* A bundled image remains available as a fallback. */}
        String entry="assets/runtime/"+name;
        ApplicationInfo info=context.getApplicationInfo();
        LinkedHashSet<String> packages=new LinkedHashSet<>();
        if(info.sourceDir!=null)packages.add(info.sourceDir);
        if(info.splitSourceDirs!=null)Collections.addAll(packages,info.splitSourceDirs);
        IOException failure=new FileNotFoundException(entry+" not found in installed APK");
        for(String path:packages) {
            if(path==null)continue;
            ZipFile zip;
            try{zip=new ZipFile(path);}catch(IOException e){failure.addSuppressed(e);continue;}
            try {
                ZipEntry item=zip.getEntry(entry);
                // Older Windows aapt2 builds emitted one backslash inside this asset directory.
                if(item==null)item=zip.getEntry("assets/runtime\\"+name);
                if(item==null){zip.close();continue;}
                InputStream stream=zip.getInputStream(item);source="installed APK / "+entry;
                return new FilterInputStream(stream){@Override public void close()throws IOException{try{super.close();}finally{zip.close();}}};
            }catch(IOException e){try{zip.close();}catch(IOException ignored){}failure.addSuppressed(e);}
        }
        // Also supports framework-managed asset paths and development/test contexts.
        try{InputStream stream=context.getAssets().open("runtime/"+name,AssetManager.ACCESS_STREAMING);source="AssetManager / runtime/"+name;return stream;}
        catch(IOException e){failure.addSuppressed(e);throw failure;}
    }
}
