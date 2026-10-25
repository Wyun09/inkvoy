package io.github.deepseekbridge;
import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.json.*;

public final class WorkspaceSelfTest {
 static int checks;interface Work{void run()throws Exception;}
 static void check(boolean ok,String message){if(!ok)throw new AssertionError(message);checks++;}
 static void fails(Work work,String message)throws Exception{try{work.run();throw new AssertionError(message);}catch(IOException expected){checks++;}}
 static byte[] tar(String name,byte[] data,char type,String target)throws Exception{byte[] header=new byte[512];put(header,0,100,name);put(header,100,8,"0000755");put(header,124,12,String.format("%011o",data.length));Arrays.fill(header,148,156,(byte)' ');header[156]=(byte)type;put(header,157,100,target);put(header,257,6,"ustar");long sum=0;for(byte b:header)sum+=b&255;put(header,148,8,String.format("%06o",sum));ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(header);out.write(data);out.write(new byte[(512-data.length%512)%512]);return out.toByteArray();}
 static void put(byte[] target,int offset,int max,String value){byte[] b=value.getBytes(StandardCharsets.UTF_8);System.arraycopy(b,0,target,offset,Math.min(max,b.length));}
 static byte[] archive(byte[]... entries)throws Exception{ByteArrayOutputStream out=new ByteArrayOutputStream();for(byte[] e:entries)out.write(e);out.write(new byte[1024]);return out.toByteArray();}
 static void extract(byte[] tar,Path output,long limit,int count)throws Exception{RuntimeInstaller.extract(new ByteArrayInputStream(tar),output.toFile(),limit,count,b->{});}
 public static void main(String[] args)throws Exception{
  Path dir=Files.createTempDirectory("studio-workspace-test-");ProjectFiles files=new ProjectFiles(dir.resolve("projects").toFile());String id="p-sample";
  files.write(id,"src/test.txt","真实文本\nneedle\n");check(files.read(id,"src/test.txt",0,1024).getString("content").contains("真实文本"),"UTF-8 read");files.write(id,"src/test.txt","changed\nneedle\n");check(files.read(id,"/workspace/src/test.txt",0,1024).getString("content").startsWith("changed"),"Atomic overwrite");check(files.list(id,"src").getJSONArray("entries").length()==1,"Directory list");check(files.search(id,"","needle").getJSONArray("matches").getJSONObject(0).getInt("line")==2,"Literal search line");check(files.read(id,"src/test.txt",0,3).getBoolean("truncated"),"Truncation visible");
  for(String path:new String[]{"../escape","/etc/passwd","/workspace/../escape","bad\\escape","\u0000"})fails(()->files.write(id,path,"bad"),"Unsafe path accepted");fails(()->files.project("../bad"),"Unsafe project accepted");
  Files.write(files.resolve(id,"binary.bin").toPath(),new byte[]{1,0,3});fails(()->files.read(id,"binary.bin",0,100),"Binary file accepted as text");
  Path normal=Files.createDirectory(dir.resolve("tar-normal"));extract(archive(tar("usr/bin/sample", "payload".getBytes(StandardCharsets.UTF_8),'0',"")),normal,1000,10);check(new String(Files.readAllBytes(normal.resolve("usr/bin/sample")),StandardCharsets.UTF_8).equals("payload"),"Tar payload");
  for(String path:new String[]{"../escaped","/absolute","a/../../escape","a\\escape"}){Path temp=Files.createTempDirectory(dir,"tar-bad-");fails(()->extract(archive(tar(path,new byte[]{1},'0',"")),temp,1000,10),"Tar traversal accepted");}
  byte[] corrupt=archive(tar("file",new byte[]{1},'0',""));corrupt[4]^=1;fails(()->extract(corrupt,Files.createTempDirectory(dir,"checksum-"),100,10),"Corrupt tar accepted");
  fails(()->extract(archive(tar("file",new byte[20],'0',"")),Files.createTempDirectory(dir,"bound-"),10,10),"Expanded bound ignored");
  fails(()->extract(archive(tar("a",new byte[0],'0',""),tar("b",new byte[0],'0',"")),Files.createTempDirectory(dir,"count-"),100,1),"File count bound ignored");
  Path links=Files.createDirectory(dir.resolve("links"));extract(archive(tar("file","same".getBytes(StandardCharsets.UTF_8),'0',""),tar("hard",new byte[0],'1',"file")),links,100,10);check(Files.isSameFile(links.resolve("file"),links.resolve("hard")),"Hard link");
  fails(()->extract(archive(tar("bad",new byte[0],'1',"../outside")),Files.createTempDirectory(dir,"hard-bad-"),100,10),"Unsafe hard link accepted");
  try{Path root=files.project(id).toPath();Path outside=Files.createDirectory(dir.resolve("outside"));Files.createSymbolicLink(root.resolve("escape"),outside);fails(()->files.write(id,"escape/test.txt","bad"),"Symlink escape accepted");}catch(UnsupportedOperationException|java.nio.file.FileSystemException e){System.out.println("Host symlink creation unavailable; Android symlink check remains a device test.");}
  System.out.println("Workspace/tar host assertions passed: "+checks);
 }
}
