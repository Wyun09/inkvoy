package io.github.deepseekbridge;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import org.json.*;

/** User-visible settings for the foreground bridge and shared-storage terminal. */
final class AccessSettings {
    static boolean sharedStorage(Context context){try{return Build.VERSION.SDK_INT>=30?Environment.isExternalStorageManager(Environment.getExternalStorageDirectory()):context.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE)==PackageManager.PERMISSION_GRANTED&&context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)==PackageManager.PERMISSION_GRANTED;}catch(RuntimeException unavailable){return false;}}
    static JSONObject status(Context context)throws JSONException {
        PowerManager power=(PowerManager)context.getSystemService(Context.POWER_SERVICE);
        NotificationManager notifications=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        return new JSONObject().put("allFiles",sharedStorage(context)).put("notifications",notifications.areNotificationsEnabled()&&(Build.VERSION.SDK_INT<33||context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED))
            .put("batteryUnrestricted",power.isIgnoringBatteryOptimizations(context.getPackageName())).put("androidSdk",Build.VERSION.SDK_INT).put("sharedMount","/shared");
    }
    static Intent intent(Context context,String action){
        String packageName=context.getPackageName();Uri app=Uri.parse("package:"+packageName);
        if(action.equals("permission-files"))return new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,app);
        if(action.equals("permission-battery"))return new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,app);
        if(action.equals("permission-notifications"))return new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,packageName);
        return new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,app);
    }
    static void request(Activity activity,String action){
        if(action.equals("permission-files")&&Build.VERSION.SDK_INT<30){activity.requestPermissions(new String[]{Manifest.permission.READ_EXTERNAL_STORAGE,Manifest.permission.WRITE_EXTERNAL_STORAGE},31);return;}
        if(action.equals("permission-notifications")&&Build.VERSION.SDK_INT>=33&&activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED&&activity.shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)){activity.requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},32);return;}
        try{activity.startActivity(intent(activity,action));}
        catch(ActivityNotFoundException e){activity.startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+activity.getPackageName())));}
    }
}
