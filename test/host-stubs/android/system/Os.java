package android.system;
import java.nio.file.*;
/** Host extraction tests only. Never compiled into the Android application. */
public final class Os {
 public static void chmod(String path,int mode)throws Exception {if(Files.getFileAttributeView(Paths.get(path),java.nio.file.attribute.PosixFileAttributeView.class)!=null)Files.setAttribute(Paths.get(path),"unix:mode",mode);}
 public static void link(String source,String destination)throws Exception{Files.createLink(Paths.get(destination),Paths.get(source));}
 public static void symlink(String target,String destination)throws Exception{Files.createSymbolicLink(Paths.get(destination),Paths.get(target));}
}
