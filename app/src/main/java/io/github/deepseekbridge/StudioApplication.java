package io.github.deepseekbridge;

import android.app.Application;

public final class StudioApplication extends Application {
    @Override public void onCreate(){
        super.onCreate();
        final Thread.UncaughtExceptionHandler previous=Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread,error)->{
            CrashDiagnostics.record(this,"uncaught / "+thread.getName(),error);
            if(previous!=null)previous.uncaughtException(thread,error);
            else {android.os.Process.killProcess(android.os.Process.myPid());System.exit(10);}
        });
    }
}
