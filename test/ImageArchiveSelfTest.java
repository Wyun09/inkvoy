package io.github.deepseekbridge;
import java.io.*;
import java.nio.file.*;
import java.util.zip.GZIPInputStream;
import org.json.*;
/** The production installer tar reader on Linux ARM64. Not an Android test. */
public final class ImageArchiveSelfTest {
 public static void main(String[] args)throws Exception{
  Path destination=Paths.get(args[1]);if(!destination.toString().equals("/tmp/studio-image-extract")||Files.exists(destination))throw new IOException("Use a fresh dedicated extraction directory");Files.createDirectory(destination);
  JSONObject manifest=new JSONObject(new String(Files.readAllBytes(Paths.get(args[2])),"UTF-8"));
  try(InputStream in=new GZIPInputStream(new FileInputStream(args[0]),131072)){RuntimeInstaller.extract(in,destination.toFile(),manifest.getLong("unpackedBytes")+10485760L,manifest.getInt("maxArchiveEntries"),n->{});}
  if(!destination.resolve("usr/bin/bash").toFile().canExecute())throw new AssertionError("Bash executable permissions");
  if(!Files.isSymbolicLink(destination.resolve("bin")))throw new AssertionError("Debian usrmerge link");
  if(((Integer)Files.getAttribute(destination.resolve("tmp"),"unix:mode")&01000)==0)throw new AssertionError("tmp sticky bit");
  if(!Files.isRegularFile(destination.resolve("opt/studio/selftest/run.sh")))throw new AssertionError("Offline fixtures");
  System.out.println("IMAGE_EXTRACT_PASS complete production tar reader, executable modes, usrmerge, sticky bit, bundled fixtures");
 }
}
