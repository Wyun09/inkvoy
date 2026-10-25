package io.github.deepseekbridge;

import java.io.*;
import java.nio.charset.*;
import java.nio.file.Files;
import java.util.*;
import org.json.*;

/** File tools cannot escape a project through .. or an on-disk symbolic link. */
public final class ProjectFiles {
    private final File projects;
    public ProjectFiles(File directory){projects=directory;projects.mkdirs();}
    public File project(String id)throws IOException{if(id==null||!id.matches("p-[a-zA-Z0-9_-]{1,80}"))throw new IOException("Invalid project ID");File p=new File(projects,id);if(Files.isSymbolicLink(p.toPath()))throw new IOException("Project root cannot be a symbolic link");if(!p.isDirectory()&&!p.mkdirs())throw new IOException("Cannot create project");return p;}
    public File resolve(String id,String path)throws IOException{
        File p=project(id);if(path==null)path="";if(path.equals("/workspace"))path="";else if(path.startsWith("/workspace/"))path=path.substring(11);
        if(path.startsWith("/")||path.indexOf('\0')>=0||path.indexOf('\\')>=0||Arrays.asList(path.split("/")).contains(".."))throw new IOException("Path must stay inside the project");
        java.nio.file.Path root=p.toPath().toRealPath(),candidate=root.resolve(path).normalize(),existing=candidate;
        while(!Files.exists(existing,java.nio.file.LinkOption.NOFOLLOW_LINKS)){existing=existing.getParent();if(existing==null)throw new IOException("Cannot resolve project path");}
        java.nio.file.Path actual=existing.toRealPath();if(!actual.startsWith(root))throw new IOException("Project symlink escapes workspace");
        java.nio.file.Path resolved=actual.resolve(existing.relativize(candidate)).normalize();if(!resolved.startsWith(root))throw new IOException("Project path escapes workspace");return resolved.toFile();
    }
    public JSONObject list(String id,String path)throws Exception{File dir=resolve(id,path);File[] files=dir.listFiles();if(files==null)throw new IOException("Cannot read directory");Arrays.sort(files,Comparator.comparing((File f)->!f.isDirectory()).thenComparing(File::getName));JSONArray entries=new JSONArray();if(files.length>10000)throw new IOException("Directory has too many entries");for(File f:files){boolean sym=Files.isSymbolicLink(f.toPath());entries.put(new JSONObject().put("name",f.getName()).put("directory",!sym&&f.isDirectory()).put("symlink",sym).put("bytes",sym?0:f.length()));}return new JSONObject().put("entries",entries);}
    public JSONObject read(String id,String path,int offset,int limit)throws Exception{
        File f=resolve(id,path);if(!f.isFile())throw new IOException("Not a regular file");limit=Math.min(1048576,Math.max(1,limit));offset=Math.max(0,offset);byte[] bytes;
        try(RandomAccessFile in=new RandomAccessFile(f,"r")){in.seek(Math.min(offset,in.length()));bytes=new byte[(int)Math.min(limit,in.length()-in.getFilePointer())];in.readFully(bytes);}
        for(byte b:bytes)if(b==0)throw new IOException("Binary file: inspect it in the terminal");
        String content;try{content=StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).decode(java.nio.ByteBuffer.wrap(bytes)).toString();}catch(CharacterCodingException e){throw new IOException("Not a complete UTF-8 text range; use the terminal for binary or split-byte data");}
        return new JSONObject().put("content",content).put("bytes",f.length()).put("truncated",offset+bytes.length<f.length());
    }
    public JSONObject write(String id,String path,String content)throws Exception{
        File f=resolve(id,path);if(f.equals(project(id).getCanonicalFile()))throw new IOException("A filename is required");byte[] bytes=content.getBytes(StandardCharsets.UTF_8);if(bytes.length>2097152)throw new IOException("Text write exceeds 2 MiB");
        File parent=f.getParentFile();if(!parent.isDirectory()&&!parent.mkdirs())throw new IOException("Cannot create parent");File temp=File.createTempFile(".studio-write-",".tmp",parent);boolean saved=false;
        if(f.isFile())try{Files.setPosixFilePermissions(temp.toPath(),Files.getPosixFilePermissions(f.toPath()));}catch(UnsupportedOperationException ignored){}catch(IOException error){temp.delete();throw error;}
        try{try(FileOutputStream out=new FileOutputStream(temp)){out.write(bytes);out.getFD().sync();}try{Files.move(temp.toPath(),f.toPath(),java.nio.file.StandardCopyOption.ATOMIC_MOVE,java.nio.file.StandardCopyOption.REPLACE_EXISTING);}catch(java.nio.file.AtomicMoveNotSupportedException e){Files.move(temp.toPath(),f.toPath(),java.nio.file.StandardCopyOption.REPLACE_EXISTING);}saved=true;}finally{if(!saved)temp.delete();}
        return new JSONObject().put("ok",true).put("bytes",bytes.length).put("path",path);
    }
    public JSONObject search(String id,String path,String query)throws Exception{
        if(query==null||query.isEmpty()||query.length()>512)throw new IOException("Search text must be 1–512 characters");JSONArray matches=new JSONArray();Deque<File> queue=new ArrayDeque<>();queue.add(resolve(id,path));int visited=0;String prefix=project(id).getCanonicalPath()+File.separator;
        while(!queue.isEmpty()&&matches.length()<100&&visited++<10000){File f=queue.removeFirst();if(Files.isSymbolicLink(f.toPath()))continue;if(f.isDirectory()){File[] c=f.listFiles();if(c!=null)for(File child:c)if(!child.getName().equals(".git"))queue.add(child);}else if(f.isFile()&&f.length()<1048576){try(BufferedReader reader=new BufferedReader(new InputStreamReader(new FileInputStream(f),StandardCharsets.UTF_8))){String line;int n=0;while((line=reader.readLine())!=null&&matches.length()<100){n++;if(line.indexOf('\0')>=0)break;if(line.contains(query))matches.put(new JSONObject().put("path",f.getCanonicalPath().substring(prefix.length())).put("line",n).put("text",line.substring(0,Math.min(400,line.length()))));}}}}
        return new JSONObject().put("matches",matches).put("limited",matches.length()>=100||visited>=10000);
    }
}
