package io.github.deepseekbridge;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;

/** Activity orientation preferences never recreate or reset the service/browser. */
public final class DisplayMode {
    private DisplayMode(){}
    public static String get(Context context){String mode=context.getSharedPreferences("studio-display",Context.MODE_PRIVATE).getString("orientation","auto");return valid(mode)?mode:"auto";}
    static boolean valid(String mode){return "auto".equals(mode)||"portrait".equals(mode)||"landscape".equals(mode);}
    static int requested(String mode){if(!valid(mode))throw new IllegalArgumentException("Unknown orientation");return "portrait".equals(mode)?ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT:"landscape".equals(mode)?ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE:ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR;}
    public static void apply(Activity activity){activity.setRequestedOrientation(requested(get(activity)));}
    public static void set(Activity activity,String mode){int orientation=requested(mode);activity.setRequestedOrientation(orientation);activity.getSharedPreferences("studio-display",Context.MODE_PRIVATE).edit().putString("orientation",mode).apply();}
}
