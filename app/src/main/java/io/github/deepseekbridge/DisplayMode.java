package io.github.deepseekbridge;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.view.*;

/** Activity orientation preferences never recreate or reset the service/browser. */
public final class DisplayMode {
    private DisplayMode(){}
    public static String get(Context context){String mode=context.getSharedPreferences("studio-display",Context.MODE_PRIVATE).getString("orientation","auto");return valid(mode)?mode:"auto";}
    static boolean valid(String mode){return "auto".equals(mode)||"portrait".equals(mode)||"landscape".equals(mode);}
    static int requested(String mode){if(!valid(mode))throw new IllegalArgumentException("Unknown orientation");return "portrait".equals(mode)?ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT:"landscape".equals(mode)?ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE:ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR;}
    public static boolean fullscreen(Context context){return context.getSharedPreferences("studio-display",Context.MODE_PRIVATE).getBoolean("fullscreen",true);}
    public static void fullscreen(Activity activity,boolean enabled){activity.getSharedPreferences("studio-display",Context.MODE_PRIVATE).edit().putBoolean("fullscreen",enabled).apply();applyFullscreen(activity);}
    public static void applyFullscreen(Activity activity){
        Window window=activity.getWindow();View decor=window.getDecorView();boolean full=fullscreen(activity);
        if(Build.VERSION.SDK_INT>=28){WindowManager.LayoutParams p=window.getAttributes();p.layoutInDisplayCutoutMode=full?WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES:WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT;window.setAttributes(p);}
        if(Build.VERSION.SDK_INT>=30){window.setDecorFitsSystemWindows(false);WindowInsetsController controller=decor.getWindowInsetsController();if(controller!=null){controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);if(full)controller.hide(WindowInsets.Type.systemBars());else controller.show(WindowInsets.Type.systemBars());}}
        else {int flags=window.getDecorView().getSystemUiVisibility();int immersive=View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE;window.getDecorView().setSystemUiVisibility(full?flags|immersive:flags&~immersive);}
        window.getDecorView().requestApplyInsets();
    }
    public static void apply(Activity activity){activity.setRequestedOrientation(requested(get(activity)));applyFullscreen(activity);}
    public static void set(Activity activity,String mode){int orientation=requested(mode);activity.setRequestedOrientation(orientation);activity.getSharedPreferences("studio-display",Context.MODE_PRIVATE).edit().putString("orientation",mode).apply();}
}
