package android.content;
import java.io.File;
import android.database.sqlite.SQLiteDatabase;
/** Host test adapter only. Never part of the APK. */
public class Context {
 public static final int MODE_PRIVATE=0;private final File root;
 public Context(File root){this.root=root;root.mkdirs();}
 public File getFilesDir(){return root;}
 public File getDatabasePath(String name){return new File(new File(root,"databases"),name);}
 public android.content.res.AssetManager getAssets(){return null;}
 public android.content.pm.ApplicationInfo getApplicationInfo(){return null;}
 public SQLiteDatabase openOrCreateDatabase(String name,int mode,Object factory){return new SQLiteDatabase(new File(root,name));}
}
