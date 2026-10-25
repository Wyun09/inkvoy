package io.github.deepseekbridge;

import android.app.Activity;
import android.app.Application;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.provider.Settings;
import java.util.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowToast;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class SettingsLaunchRegressionTest {
    public static class SettingsActivity extends Activity {
        final List<Intent> attempts=new ArrayList<>();
        final Set<String> denied=new HashSet<>(),missing=new HashSet<>();
        @Override public void startActivity(Intent intent){
            attempts.add(intent);
            if(denied.contains(intent.getAction()))throw new SecurityException("Settings activity requires a privileged permission");
            if(missing.contains(intent.getAction()))throw new ActivityNotFoundException("Settings page unavailable");
        }
    }
    private org.robolectric.android.controller.ActivityController<SettingsActivity> controller;
    private SettingsActivity activity;
    @Before public void setup(){controller=Robolectric.buildActivity(SettingsActivity.class).setup();activity=controller.get();ShadowToast.reset();}
    @After public void cleanup(){controller.pause().stop().destroy();}

    @Test public void accessibilityUsesPublicListWithoutProtectedDetailActivity(){
        AccessSettings.request(activity,"accessibility-settings");
        assertEquals(1,activity.attempts.size());Intent request=activity.attempts.get(0);
        assertEquals(Settings.ACTION_ACCESSIBILITY_SETTINGS,request.getAction());assertNull(request.getComponent());
        assertFalse(request.hasExtra("android.intent.extra.COMPONENT_NAME"));
    }
    @Test public void deniedAccessibilityListFallsBackToSystemSettings(){
        activity.denied.add(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        AccessSettings.request(activity,"accessibility-settings");
        assertEquals(2,activity.attempts.size());assertEquals(Settings.ACTION_SETTINGS,activity.attempts.get(1).getAction());
    }
    @Test public void missingAccessibilityListFallsBackToSystemSettings(){
        activity.missing.add(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        AccessSettings.request(activity,"accessibility-settings");
        assertEquals(2,activity.attempts.size());assertEquals(Settings.ACTION_SETTINGS,activity.attempts.get(1).getAction());
    }
    @Test public void deniedFallbackShowsManualInstructionsAndReturnsNormally(){
        activity.denied.add(Settings.ACTION_ACCESSIBILITY_SETTINGS);activity.denied.add(Settings.ACTION_SETTINGS);
        AccessSettings.request(activity,"accessibility-settings");
        assertEquals(2,activity.attempts.size());assertTrue(ShadowToast.getTextOfLatestToast().contains("手动进入设置"));assertTrue(ShadowToast.getTextOfLatestToast().contains("Inkvoy"));
    }
    @Test public void missingFallbackShowsManualInstructionsAndReturnsNormally(){
        activity.missing.add(Settings.ACTION_ACCESSIBILITY_SETTINGS);activity.missing.add(Settings.ACTION_SETTINGS);
        AccessSettings.request(activity,"accessibility-settings");
        assertEquals(2,activity.attempts.size());assertTrue(ShadowToast.getTextOfLatestToast().contains("无障碍"));
    }
    @Test public void otherDeniedPermissionSettingsAlsoGuardTheirFallback(){
        activity.denied.add(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);activity.denied.add(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        AccessSettings.request(activity,"permission-battery");
        assertEquals(2,activity.attempts.size());assertTrue(ShadowToast.getTextOfLatestToast().contains("应用权限"));
    }
}
