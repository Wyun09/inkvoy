package io.github.deepseekbridge;

import android.app.*;
import android.content.*;
import android.os.*;

public final class BridgeService extends Service {
    public BridgeRuntime runtime;
    public final class LocalBinder extends Binder { public BridgeService service() { return BridgeService.this; } }
    private final LocalBinder binder = new LocalBinder();
    @Override public void onCreate() { super.onCreate(); runtime = new BridgeRuntime(this); }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        NotificationManager notifications = getSystemService(NotificationManager.class);
        notifications.createNotificationChannel(new NotificationChannel("local-bridge", "本机 API 桥", NotificationManager.IMPORTANCE_LOW));
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new Notification.Builder(this, "local-bridge")
            .setSmallIcon(android.R.drawable.stat_notify_sync).setContentTitle("DeepSeek 本机桥")
            .setContentText("本机接口 127.0.0.1:8787 · 点击查看网页与状态")
            .setContentIntent(pending).setOngoing(true).build();
        startForeground(8787, notification);
        runtime.start();
        return START_NOT_STICKY;
    }
    public void stopBridge() { runtime.stop(); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); }
    @Override public IBinder onBind(Intent intent) { return binder; }
    @Override public void onDestroy() { runtime.destroy(); super.onDestroy(); }
}
