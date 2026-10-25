package io.github.deepseekbridge;

import java.io.*;
import java.nio.charset.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import org.json.*;

/** App-private text edit snapshots. Terminal changes are never claimed as captured edits. */
public final class FileRevisions {
    private static final int MAX_BYTES=2097152,PREVIEW_BYTES=262144;
    private final ProjectFiles files;
    private final File history;
    public FileRevisions(ProjectFiles files,File history){this.files=files;this.history=history;}
    private File project(String project)throws Exception{
        files.project(project);if(Files.isSymbolicLink(history.toPath()))throw new IOException("Invalid history root");if(!history.isDirectory()&&!history.mkdirs())throw new IOException("Cannot create file history");
        File dir=new File(history,project);if(Files.isSymbolicLink(dir.toPath()))throw new IOException("Invalid history directory");if(!dir.isDirectory()&&!dir.mkdirs())throw new IOException("Cannot create project history");
        if(!dir.getCanonicalFile().getParentFile().equals(history.getCanonicalFile()))throw new IOException("History escapes application storage");return dir;
    }
    private File revision(String project,String id)throws Exception{
        if(id==null||!id.matches("r-[a-f0-9]{32}"))throw new IOException("Invalid revision ID");File parent=project(project),dir=new File(parent,id);
        if(Files.isSymbolicLink(dir.toPath())||!dir.isDirectory()||!dir.getCanonicalFile().getParentFile().equals(parent.getCanonicalFile()))throw new IOException("改动快照已过期或不存在，当前文件未修改");return dir;
    }
    private static String hash(byte[] data)throws Exception{return RuntimeInstaller.hex(MessageDigest.getInstance("SHA-256").digest(data));}
    private static byte[] bytes(File file)throws IOException{if(Files.isSymbolicLink(file.toPath())||!file.isFile()||file.length()>MAX_BYTES)throw new IOException("Invalid or oversized snapshot");return Files.readAllBytes(file.toPath());}
    private static void save(File file,byte[] data)throws IOException{try(FileOutputStream out=new FileOutputStream(file)){out.write(data);out.getFD().sync();}}
    private static void metadata(File dir,JSONObject value)throws Exception{
        File tmp=new File(dir,"metadata.pending");save(tmp,value.toString().getBytes(StandardCharsets.UTF_8));move(tmp,new File(dir,"metadata.json"));
    }
    private static void move(File from,File to)throws IOException{try{Files.move(from.toPath(),to.toPath(),StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}catch(AtomicMoveNotSupportedException e){Files.move(from.toPath(),to.toPath(),StandardCopyOption.REPLACE_EXISTING);}}
    private JSONObject load(File dir,String project,String id)throws Exception{
        File m=new File(dir,"metadata.json");if(Files.isSymbolicLink(m.toPath()))throw new IOException("Invalid snapshot metadata");JSONObject meta=new JSONObject(RuntimeInstaller.read(new FileInputStream(m),65536));
        if(!project.equals(meta.getString("project"))||!id.equals(meta.getString("id")))throw new IOException("Snapshot project mismatch");files.resolve(project,meta.getString("path"));return meta;
    }
    private static String text(byte[] data)throws CharacterCodingException{for(byte b:data)if(b==0)throw new CharacterCodingException();return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).decode(java.nio.ByteBuffer.wrap(data)).toString();}
    private static long size(File dir){long n=0;File[] list=dir.listFiles();if(list!=null)for(File f:list)if(f.isFile()&&!Files.isSymbolicLink(f.toPath()))n+=f.length();return n;}
    private static void removeRevision(File dir)throws IOException{
        if(!dir.getName().matches("r-[a-f0-9]{32}")||Files.isSymbolicLink(dir.toPath()))throw new IOException("Invalid history cleanup target");File[] list=dir.listFiles();if(list==null)throw new IOException("Cannot read expired snapshot");
        for(File f:list){if(f.isDirectory()&&!Files.isSymbolicLink(f.toPath()))throw new IOException("Unexpected snapshot subdirectory");Files.delete(f.toPath());}Files.delete(dir.toPath());
    }
    private void prune(File parent)throws IOException{
        File[] dirs=parent.listFiles(f->f.isDirectory()&&!Files.isSymbolicLink(f.toPath())&&f.getName().matches("r-[a-f0-9]{32}"));if(dirs==null)throw new IOException("Cannot read file history");
        Arrays.sort(dirs,Comparator.comparingLong(File::lastModified));long total=0;for(File d:dirs)total+=size(d);int count=dirs.length;
        for(File d:dirs){if(count<64&&total<60L*1048576)break;long bytes=size(d);removeRevision(d);total-=bytes;count--;}
    }
    public synchronized JSONObject write(String project,String path,String content)throws Exception{
        File target=files.resolve(project,path);if(target.equals(files.project(project).getCanonicalFile())||target.isDirectory())throw new IOException("A filename is required");
        byte[] after=content.getBytes(StandardCharsets.UTF_8);if(after.length>MAX_BYTES||target.exists()&&target.length()>MAX_BYTES)throw new IOException("可恢复文本编辑限 2 MiB；更大文件请使用终端");
        boolean existed=target.exists();byte[] before=existed?bytes(target):new byte[0];
        if(existed&&Arrays.equals(before,after))return new JSONObject().put("ok",true).put("bytes",after.length).put("path",path).put("unchanged",true);
        File parent=project(project);prune(parent);String id="r-"+UUID.randomUUID().toString().replace("-","");File dir=new File(parent,id);if(!dir.mkdir())throw new IOException("Cannot create edit snapshot");
        String relative=files.project(project).getCanonicalFile().toPath().relativize(target.getCanonicalFile().toPath()).toString().replace(File.separatorChar,'/');
        JSONObject meta=new JSONObject().put("id",id).put("project",project).put("path",relative).put("existed",existed).put("beforeHash",hash(before)).put("afterHash",hash(after)).put("beforeBytes",before.length).put("afterBytes",after.length).put("createdAt",System.currentTimeMillis()).put("committed",false).put("reverted",false);
        if(existed)Files.copy(target.toPath(),new File(dir,"before.bin").toPath(),StandardCopyOption.COPY_ATTRIBUTES);else save(new File(dir,"before.bin"),before);
        save(new File(dir,"after.bin"),after);metadata(dir,meta);
        JSONObject result=files.write(project,relative,content);meta.put("committed",true);try{metadata(dir,meta);}catch(IOException commitError){result.put("historyWarning","文件已写入，快照标记需在下次读取时按内容校验恢复");}
        return result.put("change",new JSONObject().put("id",id).put("path",relative).put("kind",existed?"modified":"created").put("beforeBytes",before.length).put("afterBytes",after.length));
    }
    public synchronized JSONObject get(String project,String id)throws Exception{
        File dir=revision(project,id);JSONObject m=load(dir,project,id);byte[] before=bytes(new File(dir,"before.bin")),after=bytes(new File(dir,"after.bin"));
        if(!hash(before).equals(m.getString("beforeHash"))||!hash(after).equals(m.getString("afterHash")))throw new IOException("改动快照校验失败");
        File target=files.resolve(project,m.getString("path"));boolean current=target.isFile()&&target.length()<=MAX_BYTES&&hash(bytes(target)).equals(m.getString("afterHash"));
        if(m.optBoolean("revertRequested")&&!m.optBoolean("reverted")&&(!m.getBoolean("existed")&&!target.exists()||m.getBoolean("existed")&&target.isFile()&&target.length()<=MAX_BYTES&&hash(bytes(target)).equals(m.getString("beforeHash")))){m.put("reverted",true);metadata(dir,m);}
        if(!m.optBoolean("committed")&&current){m.put("committed",true);metadata(dir,m);}
        JSONObject result=new JSONObject(m.toString()).put("canRevert",m.optBoolean("committed")&&!m.optBoolean("reverted")&&current).put("previewable",false).put("retention","每项目最近 64 次，约 64 MiB；终端改动不包含在内");
        if(before.length<=PREVIEW_BYTES&&after.length<=PREVIEW_BYTES)try{result.put("before",text(before)).put("after",text(after)).put("previewable",true);}catch(CharacterCodingException ignored){}
        return result;
    }
    public synchronized JSONObject revert(String project,String id)throws Exception{
        File dir=revision(project,id);JSONObject state=get(project,id);if(state.optBoolean("reverted"))return new JSONObject().put("ok",true).put("alreadyReverted",true);
        if(!state.optBoolean("canRevert"))throw new IOException("文件已有后续修改，无法撤回；请先查看当前文件，避免覆盖新内容");
        JSONObject pending=load(dir,project,id);pending.put("revertRequested",true);metadata(dir,pending);
        File target=files.resolve(project,state.getString("path"));
        if(state.getBoolean("existed")){
            File tmp=File.createTempFile(".studio-revert-",".tmp",target.getParentFile());boolean saved=false;
            try{Files.copy(new File(dir,"before.bin").toPath(),tmp.toPath(),StandardCopyOption.COPY_ATTRIBUTES,StandardCopyOption.REPLACE_EXISTING);try(RandomAccessFile sync=new RandomAccessFile(tmp,"rw")){sync.getFD().sync();}move(tmp,target);saved=true;}finally{if(!saved)tmp.delete();}
        }else Files.delete(target.toPath());
        JSONObject m=load(dir,project,id);m.put("reverted",true).put("revertedAt",System.currentTimeMillis());metadata(dir,m);return new JSONObject().put("ok",true).put("path",state.getString("path"));
    }
}
