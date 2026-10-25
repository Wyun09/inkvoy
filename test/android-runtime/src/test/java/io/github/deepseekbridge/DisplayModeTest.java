package io.github.deepseekbridge;
import android.app.*;
import android.content.pm.ActivityInfo;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class DisplayModeTest {
    @Test public void modesPersistAndApplyWithoutRestartingTheActivity(){
        Activity activity=Robolectric.buildActivity(Activity.class).setup().get();
        try{for(String mode:new String[]{"portrait","landscape","auto"}){DisplayMode.set(activity,mode);assertEquals(mode,DisplayMode.get(activity));assertEquals(DisplayMode.requested(mode),activity.getRequestedOrientation());assertFalse(activity.isFinishing());}assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR,activity.getRequestedOrientation());}finally{activity.finish();}
    }
    @Test public void invalidModeDoesNotReplacePersistedPreference(){
        Activity activity=Robolectric.buildActivity(Activity.class).setup().get();try{DisplayMode.set(activity,"portrait");try{DisplayMode.set(activity,"random");fail();}catch(IllegalArgumentException expected){}assertEquals("portrait",DisplayMode.get(activity));}finally{activity.finish();}
    }
}
