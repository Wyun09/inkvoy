package io.github.deepseekbridge;

import android.app.*;
import android.content.*;
import android.os.*;

public class BridgeService extends Service {
    public BridgeRuntime runtime;
    public String startupFailure="";
    public final class LocalBinder extends Binder { public BridgeService service() { return BridgeService.this; } }
    private final LocalBinder binder = new LocalBinder();
    protected BridgeRuntime createRuntime(){return new BridgeRuntime(this);}
    @Override public void onCreate() {
        super.onCreate();
        try{promote();runtime=createRuntime();}
        catch(Throwable error){startupFailure=CrashDiagnostics.record(this,"service initialization",error);}
    }
    private void promote() {
        NotificationManager notifications = getSystemService(NotificationManager.class);
        notifications.createNotificationChannel(new NotificationChannel("local-bridge", "本机 API 桥", NotificationManager.IMPORTANCE_LOW));
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new Notification.Builder(this, "local-bridge")
            .setSmallIcon(android.R.drawable.stat_notify_sync).setContentTitle("DeepSeek 工作室")
            .setContentText("本机接口 127.0.0.1:8787 · 点击查看网页与状态")
            .setContentIntent(pending).setOngoing(true).build();
        startForeground(8787, notification);
    }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if(runtime==null)return START_NOT_STICKY;
        runtime.start();
        return START_NOT_STICKY;
    }
    public void stopBridge() { if(runtime!=null)runtime.stop(); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); }
    @Override public IBinder onBind(Intent intent) { return binder; }
    @Override public void onDestroy() { if(runtime!=null)runtime.destroy(); super.onDestroy(); }
}
