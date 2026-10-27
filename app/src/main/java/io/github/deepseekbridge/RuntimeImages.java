package io.github.deepseekbridge;

import android.content.Context;
import org.json.JSONObject;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;

/** A separately supplied image is accepted only against the manifest pinned in the APK. */
final class RuntimeImages {
    interface Progress { void update(long bytes,long total); }
    static File image(Context context,JSONObject manifest)throws Exception {
        String hash=manifest.getString("sha256");
        if(!hash.matches("[a-f0-9]{64}"))throw new IOException("Invalid pinned image digest");
        File directory=new File(context.getFilesDir(),"runtime-images");
        if(Files.isSymbolicLink(directory.toPath()))throw new IOException("Invalid image directory");
        File file=new File(directory,hash+".tar.gz");
        if(Files.isSymbolicLink(file.toPath()))throw new IOException("Invalid image path");
        return file;
    }
    static File importImage(Context context,JSONObject manifest,InputStream input,Progress progress)throws Exception {
        File target=image(context,manifest),directory=target.getParentFile();
        if(!directory.isDirectory()&&!directory.mkdirs())throw new IOException("无法创建工具包目录");
        File incoming=new File(directory,target.getName()+".incoming");
        if(Files.isSymbolicLink(incoming.toPath()))throw new IOException("Invalid temporary image path");
        long expected=manifest.getLong("compressedBytes"),copied=0,last=0;MessageDigest digest=MessageDigest.getInstance("SHA-256");
        try {
            try(FileOutputStream output=new FileOutputStream(incoming)) {
                byte[] buffer=new byte[131072];int n;
                while((n=input.read(buffer))!=-1){
                    if(Thread.currentThread().isInterrupted())throw new IOException("工具包导入已取消");
                    copied+=n;if(copied>expected)throw new IOException("工具包大小与此版本清单不匹配");
                    digest.update(buffer,0,n);output.write(buffer,0,n);
                    long now=android.os.SystemClock.elapsedRealtime();if(now-last>=250){last=now;if(progress!=null)progress.update(copied,expected);}
                }
                output.getFD().sync();
            }
            if(copied!=expected||!RuntimeInstaller.hex(digest.digest()).equals(manifest.getString("sha256")))throw new IOException("工具包完整性校验失败，请选择与当前版本对应的 debian-arm64.tar.gz");
            try{Files.move(incoming.toPath(),target.toPath(),StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}
            catch(AtomicMoveNotSupportedException e){Files.move(incoming.toPath(),target.toPath(),StandardCopyOption.REPLACE_EXISTING);}
            if(progress!=null)progress.update(copied,expected);return target;
        }finally{if(incoming.exists())incoming.delete();}
    }
}
