package io.github.deepseekbridge;

import android.content.Context;
import android.os.Build;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/** A bounded local stack trace. No chat state, credentials or request bodies. */
public final class CrashDiagnostics {
    static String version(Context context){try{android.content.pm.PackageInfo info=context.getPackageManager().getPackageInfo(context.getPackageName(),0);return info.versionName==null?"unknown":info.versionName;}catch(Exception ignored){return "unknown";}}
    private static File file(Context context){return new File(context.getFilesDir(),"last-startup-error.txt");}
    public static String record(Context context,String stage,Throwable error){
        String value;
        try{StringWriter text=new StringWriter();error.printStackTrace(new PrintWriter(text));value="Inkvoy "+version(context)+"\nAndroid "+Build.VERSION.RELEASE+" / API "+Build.VERSION.SDK_INT+"\nStage: "+stage+"\nTime: "+new Date()+"\n\n"+text;}
        catch(Throwable ignored){value="启动失败："+error.getClass().getSimpleName();}
        value=redact(value);if(value.length()>16384)value=value.substring(0,16384);
        try(FileOutputStream output=new FileOutputStream(file(context))){output.write(value.getBytes(StandardCharsets.UTF_8));output.getFD().sync();}catch(Throwable ignored){}
        return value;
    }
    static String redact(String value){return value.replaceAll("android-[0-9a-fA-F]{48,}","[API key redacted]").replaceAll("(?i)Bearer\\s+[^\\s]+","Bearer [redacted]");}
    public static String read(Context context){try(InputStream input=new FileInputStream(file(context));ByteArrayOutputStream output=new ByteArrayOutputStream()){byte[] b=new byte[2048];int n;while(output.size()<65536&&(n=input.read(b,0,Math.min(b.length,65536-output.size())))!=-1)output.write(b,0,n);return new String(output.toByteArray(),StandardCharsets.UTF_8);}catch(Exception ignored){return "";}}
    public static void clear(Context context){try{file(context).delete();}catch(Exception ignored){}}
}
