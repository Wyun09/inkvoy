package io.github.deepseekbridge;

import android.app.Application;
import android.content.*;
import android.os.Build;
import android.provider.Settings;
import android.webkit.WebView;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class AccessSettingsTest {
    @Test public void permissionActionsTargetThisApplication(){
        Context context=RuntimeEnvironment.getApplication();
        Intent files=AccessSettings.intent(context,"permission-files");assertEquals(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,files.getAction());assertEquals("package:"+context.getPackageName(),files.getDataString());
        Intent battery=AccessSettings.intent(context,"permission-battery");assertEquals(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,battery.getAction());assertEquals(files.getDataString(),battery.getDataString());
        Intent notifications=AccessSettings.intent(context,"permission-notifications");assertEquals(Settings.ACTION_APP_NOTIFICATION_SETTINGS,notifications.getAction());assertEquals(context.getPackageName(),notifications.getStringExtra(Settings.EXTRA_APP_PACKAGE));
    }
    @Test public void statusReportsActualGrantsInsteadOfAssumingDeclarationIsAuthorization()throws Exception {
        Context context=RuntimeEnvironment.getApplication();
        org.robolectric.Shadows.shadowOf((Application)context).denyPermissions(android.Manifest.permission.READ_EXTERNAL_STORAGE,android.Manifest.permission.WRITE_EXTERNAL_STORAGE);
        if(Build.VERSION.SDK_INT>=30)org.robolectric.Shadows.shadowOf((android.app.AppOpsManager)context.getSystemService(Context.APP_OPS_SERVICE)).setMode(android.app.AppOpsManager.OPSTR_MANAGE_EXTERNAL_STORAGE,android.os.Process.myUid(),context.getPackageName(),android.app.AppOpsManager.MODE_ERRORED);
        org.robolectric.Shadows.shadowOf((android.os.PowerManager)context.getSystemService(Context.POWER_SERVICE)).setIgnoringBatteryOptimizations(context.getPackageName(),false);
        org.json.JSONObject status=AccessSettings.status(context);
        assertEquals(Build.VERSION.SDK_INT,status.getInt("androidSdk"));assertEquals("/shared",status.getString("sharedMount"));assertFalse(status.getBoolean("allFiles"));assertFalse(status.getBoolean("batteryUnrestricted"));
    }
    @Test @Config(sdk=33) public void sharedStorageStatusReflectsAppOpsGrant()throws Exception {
        Context context=RuntimeEnvironment.getApplication();
        android.app.AppOpsManager appOps=(android.app.AppOpsManager)context.getSystemService(Context.APP_OPS_SERVICE);
        org.robolectric.Shadows.shadowOf(appOps).setMode(android.app.AppOpsManager.OPSTR_MANAGE_EXTERNAL_STORAGE,android.os.Process.myUid(),context.getPackageName(),android.app.AppOpsManager.MODE_ALLOWED);
        assertTrue(AccessSettings.status(context).getBoolean("allFiles"));
        org.robolectric.Shadows.shadowOf(appOps).setMode(android.app.AppOpsManager.OPSTR_MANAGE_EXTERNAL_STORAGE,android.os.Process.myUid(),context.getPackageName(),android.app.AppOpsManager.MODE_ERRORED);
        assertFalse(AccessSettings.status(context).getBoolean("allFiles"));
    }
}
