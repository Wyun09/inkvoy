package io.github.deepseekbridge;

import android.content.*;
import android.net.Uri;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.os.ParcelFileDescriptor;
import android.os.SystemClock;
import android.system.Os;
import android.system.OsConstants;
import android.util.Base64;
import com.termux.terminal.JNI;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/** Real local execution backend, reachable exclusively from the packaged WebView. */
public final class StudioRuntime {
    public interface Events{void event(JSONObject event);}
    public interface Reply{void done(boolean ok,Object value);}
    public interface BrowserTool{JSONObject run(String id,JSONObject args)throws Exception;void cancel();}
    public BrowserTool browserTool;
    private final Context context;
    private final Events events;
    private final ExecutorService workers=Executors.newFixedThreadPool(4);
    private final Map<String,Command> commands=new ConcurrentHashMap<>();
    private final Map<String,Pty> terminals=new ConcurrentHashMap<>();
    private final RuntimeInstaller installer;
    public final ProjectFiles files;
    public final ChatMedia media;
    private final ManagedTasks managed;
    private final FileRevisions revisions;
    private volatile ToolJournal journal;
    private volatile boolean closed,bootVerified;
    private final java.util.concurrent.atomic.AtomicInteger work=new java.util.concurrent.atomic.AtomicInteger();
    public StudioRuntime(Context context,Events events){this.context=context;this.events=events;media=new ChatMedia(context);files=new ProjectFiles(new File(context.getFilesDir(),"projects"));revisions=new FileRevisions(files,new File(context.getFilesDir(),"file-revisions"));installer=new RuntimeInstaller(context,s->emit("runtime",s));managed=new ManagedTasks(this::launchManaged,this::managedChanged);}
    private synchronized ToolJournal journal()throws IOException{if(closed)throw new IOException("运行时已关闭");if(journal==null)journal=new ToolJournal(context);return journal;}
    private void emit(String type,Object value){try{events.event(new JSONObject().put("type",type).put("value",value));}catch(JSONException ignored){}}
    private void event(JSONObject value){events.event(value);}
    public void request(String operation,JSONObject args,Reply reply){
        if(closed){reply.done(false,error("运行时已关闭"));return;}
        if(operation.equals("command.cancel")||operation.equals("runtime.status")) {
            try{reply.done(true,handle(operation,args));}catch(Exception e){reply.done(false,error(e.getMessage()));}return;
        }
        boolean tracked=operation.equals("runtime.ensure")||operation.equals("runtime.test")||operation.equals("tool.execute")||operation.equals("terminal.open");
        workers.submit(()->{if(tracked){work.incrementAndGet();emit("work",work.get()+managed.activeCount());}try{if(closed)throw new IOException("运行时已停止，排队操作未执行");reply.done(true,handle(operation,args));}catch(Throwable e){reply.done(false,error(e.getMessage()==null?e.getClass().getSimpleName():e.getMessage()));}finally{if(tracked){work.decrementAndGet();emit("work",work.get()+managed.activeCount());}}});
    }
    private static JSONObject error(String message){JSONObject j=new JSONObject();try{j.put("message",message);}catch(JSONException ignored){}return j;}
    private Object handle(String operation,JSONObject a)throws Exception{
        String project=a.optString("project");
        switch(operation){
            case "project.ensure":files.project(project);return true;
            case "runtime.status":return installer.status();
            case "runtime.ensure":ensure(project);return installer.status();
            case "runtime.test":ensure(project);return selfTest(project);
            case "file.list":return files.list(project,a.optString("path"));
            case "file.read":return files.read(project,a.getString("path"),a.optInt("offset"),a.optInt("limit",65536));
            case "file.attachment":return media.attach(files.resolve(project,a.getString("path")),project,a.getString("path"));
            case "media.data":return media.data(a.getString("id"));
            case "file.write":return revisions.write(project,a.getString("path"),a.getString("content"));
            case "file.change":return revisions.get(project,a.getString("id"));
            case "file.revert":return revisions.revert(project,a.getString("id"));
            case "file.search":return files.search(project,a.optString("path"),a.getString("query"));
            case "command.cancel":{String id=a.getString("id");journal().cancel(id);Command c=commands.get(id);if(c!=null)c.cancel();managed.cancelStart(id);if(browserTool!=null)browserTool.cancel();return new JSONObject().put("cancelled",true);}
            case "process.list":return managed.list(project,a.optBoolean("logs"));
            case "process.status":return managed.status(project,a.getString("id"));
            case "process.stop":return managed.stop(project,a.getString("id"));
            case "terminal.open":return openTerminal(project,a.optInt("rows",24),a.optInt("cols",80));
            case "terminal.list":{JSONArray list=new JSONArray();for(Pty t:terminals.values())if(t.project.equals(project))list.put(new JSONObject().put("id",t.id).put("exited",t.exited));return new JSONObject().put("sessions",list);}
            case "terminal.attach":{Pty t=terminal(a);synchronized(t){String buffer=Base64.encodeToString(t.pending.toByteArray(),Base64.NO_WRAP);boolean truncated=t.pendingTruncated;t.pending.reset();t.pendingTruncated=false;t.attached=true;return new JSONObject().put("buffer",buffer).put("truncated",truncated).put("exited",t.exited).put("exitCode",t.exitCode);}}
            case "terminal.input":{Pty t=terminal(a);byte[] input=a.getString("data").getBytes(StandardCharsets.UTF_8);if(input.length>65536)throw new IOException("Terminal input exceeds 64 KiB");synchronized(t){if(t.exited)throw new IOException("终端已退出");t.output.write(input);t.output.flush();}return true;}
            case "terminal.resize":{Pty t=terminal(a);if(!t.exited)JNI.setPtyWindowSize(t.fd,Math.max(2,Math.min(300,a.optInt("rows",24))),Math.max(10,Math.min(500,a.optInt("cols",80))),0,0);return true;}
            case "terminal.close":{Pty t=terminals.remove(a.getString("id"));if(t!=null)t.close();return true;}
            case "tool.execute":return tool(a);
            default:throw new IOException("Unknown local operation");
        }
    }
    private synchronized void ensure(String project)throws Exception{
        files.project(project);installer.ensure();if(bootVerified)return;
        try{configureDns();JSONObject result=command("bootstrap-"+UUID.randomUUID(),project,"test -d /workspace && test -r /etc/os-release && printf 'STUDIO_BOOT_OK\\n'", "",30);if(result.optInt("exitCode",-1)!=0||!result.optString("stdout").contains("STUDIO_BOOT_OK"))throw new IOException("Debian 启动失败（exit="+result.optInt("exitCode",-1)+"）："+result.optString("stderr"));bootVerified=true;installer.booted();}
        catch(Exception e){installer.setError(e.getMessage());throw e;}
    }
    private void configureDns()throws IOException{
        StringBuilder dns=new StringBuilder();
        try{android.net.ConnectivityManager connectivity=(android.net.ConnectivityManager)context.getSystemService(Context.CONNECTIVITY_SERVICE);android.net.LinkProperties link=connectivity.getLinkProperties(connectivity.getActiveNetwork());if(link!=null)for(java.net.InetAddress address:link.getDnsServers()){String ip=address.getHostAddress();if(ip!=null){int zone=ip.indexOf('%');if(zone>=0)ip=ip.substring(0,zone);if(ip.matches("[0-9a-fA-F:.]+"))dns.append("nameserver ").append(ip).append('\n');}}}catch(Exception ignored){}
        if(dns.length()==0)dns.append("nameserver 1.1.1.1\nnameserver 8.8.8.8\n");
        try(FileOutputStream out=new FileOutputStream(new File(installer.root(),"etc/resolv.conf"))){out.write(dns.toString().getBytes(StandardCharsets.US_ASCII));}
    }
    private Object tool(JSONObject a)throws Exception{
        String id=a.getString("id"),project=a.getString("project"),name=a.getString("name");JSONObject args=a.getJSONObject("args");
        JSONObject fingerprint=new JSONObject().put("project",project).put("name",name).put("args",args);
        // Canonical keys avoid changing a request's identity across JSON serialization.
        JSONObject cached=journal().claim(id,canonical(fingerprint));if(cached!=null)return cached;
        JSONObject result;
        try{journal().running(id);if(journal().cancelled(id))throw new IOException("工具在执行前已取消");switch(name){
            case "process":result=managedTool(id,project,args);break;
            case "terminal":ensure(project);result=command(id,project,args.getString("command"),args.optString("cwd"),args.optInt("timeout_seconds",120));break;
            case "read_file":result=files.read(project,args.getString("path"),args.optInt("offset"),args.optInt("limit",65536));break;
            case "write_file":result=revisions.write(project,args.getString("path"),args.getString("content"));break;
            case "list_files":result=files.list(project,args.optString("path"));break;
            case "search_files":result=files.search(project,args.optString("path"),args.getString("query"));break;
            case "view_image":{JSONObject attachment=media.attach(files.resolve(project,args.getString("path")),project,args.getString("path"));if(!attachment.optBoolean("image"))throw new IOException("文件不是可解码的图片");result=new JSONObject().put("ok",true).put("attachment",attachment).put("notice","图片像素将在下一次模型请求中作为图像消息提供");break;}
            case "browser":if(browserTool==null)throw new IOException("AI 浏览器尚未就绪");result=browserTool.run(id,args);break;
            default:throw new IOException("Unknown built-in tool");
        }if(!result.has("ok"))result.put("ok",true);}catch(Exception e){result=new JSONObject().put("ok",false).put("error",e.getMessage()==null?"工具执行已中断":e.getMessage());}
        if(result.toString().getBytes(StandardCharsets.UTF_8).length>524288){for(String key:new String[]{"stdout","stderr"})if(result.has(key)){String value=result.optString(key);result.put(key,value.substring(0,Math.min(16384,value.length())));}result.put("truncated",true);}
        journal().finish(id,result);return result;
    }
    private void managedChanged(){emit("work",work.get()+managed.activeCount());emit("process",true);}
    private JSONObject managedTool(String id,String project,JSONObject args)throws Exception{
        switch(args.getString("action")){
            case "start":ensure(project);if(journal().cancelled(id))throw new IOException("常驻任务在启动前已取消");return managed.start(id,project,args);
            case "list":return managed.list(project);
            case "status":return managed.status(project,args.getString("id"));
            case "stop":return managed.stop(project,args.getString("id"));
            default:throw new IOException("Unknown process action");
        }
    }
    private ManagedTasks.Child launchManaged(String project,String command,String cwd)throws Exception{
        List<String> args=argv(project,cwd,false,command);String[] env=environment().entrySet().stream().map(e->e.getKey()+"="+e.getValue()).toArray(String[]::new);
        int[] spawned=NativePty.spawnPiped(args.get(0),files.project(project).getPath(),args.toArray(new String[0]),env);final int pid=spawned[0];
        final ParcelFileDescriptor outFd=ParcelFileDescriptor.adoptFd(spawned[1]),errFd=ParcelFileDescriptor.adoptFd(spawned[2]);
        final InputStream out=new ParcelFileDescriptor.AutoCloseInputStream(outFd),err=new ParcelFileDescriptor.AutoCloseInputStream(errFd);
        return new ManagedTasks.Child(){volatile boolean reaped;public InputStream stdout(){return out;}public InputStream stderr(){return err;}public int pid(){return pid;}public int await(){int code=JNI.waitFor(pid);reaped=true;return code;}public void stop(boolean force){if(reaped)return;int signal=force?OsConstants.SIGKILL:OsConstants.SIGQUIT;try{Os.kill(force?-pid:pid,signal);}catch(Exception ignored){}if(force)try{Os.kill(pid,signal);}catch(Exception ignored){}}};
    }
    private static String canonical(Object value)throws JSONException{if(value instanceof JSONObject){JSONObject object=(JSONObject)value;List<String> keys=new ArrayList<>();object.keys().forEachRemaining(keys::add);Collections.sort(keys);StringBuilder out=new StringBuilder("{");for(String key:keys){if(out.length()>1)out.append(',');out.append(JSONObject.quote(key)).append(':').append(canonical(object.get(key)));}return out.append('}').toString();}if(value instanceof JSONArray){JSONArray array=(JSONArray)value;StringBuilder out=new StringBuilder("[");for(int i=0;i<array.length();i++){if(i>0)out.append(',');out.append(canonical(array.get(i)));}return out.append(']').toString();}return value instanceof String?JSONObject.quote((String)value):String.valueOf(value);}
    private List<String> argv(String project,String cwd,boolean interactive,String command)throws Exception{
        File projectDir=files.project(project),work=files.resolve(project,cwd);if(!work.isDirectory())throw new IOException("Command working directory does not exist");
        String relative=projectDir.getCanonicalFile().toPath().relativize(work.toPath()).toString();String lib=context.getApplicationInfo().nativeLibraryDir;
        File executable=new File(lib,"libproot.so"),loader=new File(lib,"libproot_loader.so");if(!executable.canExecute()||!loader.canExecute())throw new IOException("APK 的原生启动器未正确解包，请重新安装完整 ARM64 版");
        List<String> args=new ArrayList<>(Arrays.asList(executable.getPath(),"-0","--link2symlink","--kill-on-exit","--sysvipc","-r",installer.root().getPath()));
        for(String mount:new String[]{"/dev","/proc","/sys","/system","/apex"})if(new File(mount).isDirectory()){args.add("-b");args.add(mount);}
        if(AccessSettings.sharedStorage(context)){File shared=android.os.Environment.getExternalStorageDirectory();if(shared.isDirectory()){File guestShared=new File(installer.root(),"shared");if(!guestShared.isDirectory()&&!guestShared.mkdirs())throw new IOException("无法创建 /shared 挂载目录");args.add("-b");args.add(shared.getAbsolutePath()+":/shared");}}
        args.addAll(Arrays.asList("-b",projectDir.getPath()+":/workspace","-w","/workspace"+(relative.isEmpty()?"":"/"+relative),"/usr/bin/env","-i","HOME=/root","USER=root","LOGNAME=root","SHELL=/bin/bash","PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","TERM=xterm-256color","LANG=C.UTF-8","COLORTERM=truecolor","TMPDIR=/tmp","/bin/bash"));
        if(interactive)args.add("--login");else{args.add("-lc");args.add(command);}return args;
    }
    private Map<String,String> environment(){String lib=context.getApplicationInfo().nativeLibraryDir;File temp=new File(context.getCacheDir(),"proot-tmp");temp.mkdirs();Map<String,String> env=new HashMap<>();env.put("PATH","/system/bin");env.put("ANDROID_ROOT","/system");env.put("ANDROID_DATA","/data");env.put("PROOT_LOADER",lib+"/libproot_loader.so");env.put("PROOT_TMP_DIR",temp.getPath());env.put("PROOT_NO_SECCOMP","1");env.put("LD_LIBRARY_PATH",lib);env.put("TMPDIR",temp.getPath());return env;}
    private static final class Capture implements Runnable{final InputStream input;final ByteArrayOutputStream bytes=new ByteArrayOutputStream();boolean truncated;Capture(InputStream in){input=in;}public void run(){try(InputStream stream=input){byte[] b=new byte[8192];int n;while((n=stream.read(b))!=-1){int size=Math.min(n,131072-bytes.size());if(size>0)bytes.write(b,0,size);if(size<n)truncated=true;}}catch(IOException ignored){}}String text(){return new String(bytes.toByteArray(),StandardCharsets.UTF_8);}}
    private static final class Command{volatile int pid;volatile boolean cancelled;final CountDownLatch done=new CountDownLatch(1);volatile int exitCode;void cancel(){if(done.getCount()==0)return;cancelled=true;if(pid>0)try{Os.kill(pid,OsConstants.SIGQUIT);}catch(Exception ignored){}}}
    private JSONObject command(String id,String project,String command,String cwd,int seconds)throws Exception{
        if(journal().cancelled(id))return new JSONObject().put("ok",false).put("executed",false).put("cancelled",true).put("error","命令在启动前已取消");
        if(command.isEmpty()||command.length()>32768||command.indexOf('\0')>=0)throw new IOException("Command must be 1–32768 characters without NUL");seconds=Math.max(1,Math.min(600,seconds));Command job=new Command();if(commands.putIfAbsent(id,job)!=null)throw new IOException("Command ID is already active");long start=SystemClock.elapsedRealtime();
        try{if(journal().cancelled(id)||job.cancelled)return new JSONObject().put("ok",false).put("executed",false).put("cancelled",true);List<String> args=argv(project,cwd,false,command);String[] env=environment().entrySet().stream().map(e->e.getKey()+"="+e.getValue()).toArray(String[]::new);int[] spawned=NativePty.spawnPiped(args.get(0),files.project(project).getPath(),args.toArray(new String[0]),env);job.pid=spawned[0];if(job.cancelled)job.cancel();
            ParcelFileDescriptor outFd=ParcelFileDescriptor.adoptFd(spawned[1]),errFd=ParcelFileDescriptor.adoptFd(spawned[2]);Capture stdout=new Capture(new ParcelFileDescriptor.AutoCloseInputStream(outFd)),stderr=new Capture(new ParcelFileDescriptor.AutoCloseInputStream(errFd));Thread out=new Thread(stdout,"studio-stdout"),err=new Thread(stderr,"studio-stderr");out.start();err.start();
            new Thread(()->{job.exitCode=JNI.waitFor(job.pid);job.done.countDown();},"studio-command-wait").start();
            boolean finished=job.done.await(seconds,TimeUnit.SECONDS);if(!finished)job.cancel();if(!job.done.await(5,TimeUnit.SECONDS)){try{Os.kill(-job.pid,OsConstants.SIGKILL);}catch(Exception ignored){}try{Os.kill(job.pid,OsConstants.SIGKILL);}catch(Exception ignored){}if(!job.done.await(5,TimeUnit.SECONDS))throw new IOException("命令停止状态未确认，请检查进程后继续");}out.join(5000);err.join(5000);
            boolean incomplete=out.isAlive()||err.isAlive();if(incomplete){try{outFd.close();}catch(IOException ignored){}try{errFd.close();}catch(IOException ignored){}}
            return new JSONObject().put("ok",finished&&!job.cancelled&&job.exitCode==0).put("stdout",stdout.text()).put("stderr",stderr.text()).put("exitCode",job.exitCode).put("timedOut",!finished).put("cancelled",job.cancelled&&finished).put("durationMs",SystemClock.elapsedRealtime()-start).put("truncated",stdout.truncated||stderr.truncated||incomplete).put("outputIncomplete",incomplete);
        }finally{commands.remove(id);if(job.pid>0&&job.done.getCount()>0)job.cancel();}
    }
    private Pty terminal(JSONObject a)throws Exception{Pty t=terminals.get(a.getString("id"));if(t==null)throw new IOException("Terminal session not found");return t;}
    private final class Pty{
        final String id,project;final int fd,pid;final ParcelFileDescriptor descriptor;final FileInputStream input;final FileOutputStream output;final ByteArrayOutputStream pending=new ByteArrayOutputStream();volatile boolean exited,attached;boolean pendingTruncated;int exitCode;
        Pty(String id,String project,int fd,int pid)throws IOException{this.id=id;this.project=project;this.fd=fd;this.pid=pid;descriptor=ParcelFileDescriptor.adoptFd(fd);input=new FileInputStream(descriptor.getFileDescriptor());output=new FileOutputStream(descriptor.getFileDescriptor());}
        synchronized void accept(byte[] data,int length)throws JSONException{if(attached)event(new JSONObject().put("type","terminal").put("id",id).put("data",Base64.encodeToString(data,0,length,Base64.NO_WRAP)));else{if(pending.size()+length>262144){pendingTruncated=true;byte[] old=pending.toByteArray();pending.reset();int keep=Math.max(0,131072-length);pending.write(old,Math.max(0,old.length-keep),Math.min(keep,old.length));}pending.write(data,0,length);}}
        synchronized void finish(int code){exitCode=code;exited=true;try{descriptor.close();}catch(IOException ignored){}}
        synchronized void close(){if(exited)return;exited=true;try{Os.kill(pid,OsConstants.SIGQUIT);}catch(Exception ignored){}try{descriptor.close();}catch(IOException ignored){}}
    }
    private synchronized JSONObject openTerminal(String project,int rows,int cols)throws Exception{
        if(terminals.size()>=4)throw new IOException("最多 4 个终端会话");ensure(project);List<String> args=argv(project,"",true,null);Map<String,String> env=environment();String[] envArray=env.entrySet().stream().map(e->e.getKey()+"="+e.getValue()).toArray(String[]::new);int[] pid=new int[1];
        int fd=JNI.createSubprocess(args.get(0),files.project(project).getPath(),args.toArray(new String[0]),envArray,pid,Math.max(2,Math.min(300,rows)),Math.max(10,Math.min(500,cols)),0,0);if(fd<0||pid[0]<=0)throw new IOException("创建 PTY 失败");
        String id=UUID.randomUUID().toString();Pty t=new Pty(id,project,fd,pid[0]);terminals.put(id,t);
        Thread reader=new Thread(()->{try{byte[] b=new byte[8192];int n;while((n=t.input.read(b))!=-1)t.accept(b,n);}catch(Exception ignored){}},"studio-pty-reader");reader.start();
        new Thread(()->{int code=JNI.waitFor(t.pid);try{reader.join(1000);}catch(InterruptedException e){Thread.currentThread().interrupt();}t.finish(code);try{if(t.attached)event(new JSONObject().put("type","terminal").put("id",id).put("exitCode",code));}catch(JSONException ignored){}},"studio-pty-wait").start();
        return new JSONObject().put("id",id).put("pid",pid[0]);
    }
    private JSONObject selfTest(String project)throws Exception{
        String script="/opt/studio/selftest/run.sh";
        JSONObject result=command("selftest-"+UUID.randomUUID(),project,script,"",600);installer.verified(result.optBoolean("ok"));return result;
    }
    public void importFile(Uri uri,String project){workers.submit(()->{JSONObject event=new JSONObject();try{String name="imported-file";try(Cursor c=context.getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){if(c!=null&&c.moveToFirst())name=c.getString(0);}name=name.replaceAll("[\\\\/\\x00-\\x1f]","_");if(name.isEmpty()||name.equals(".")||name.equals(".."))name="imported-file";File target=files.resolve(project,name);if(target.exists()){String base=name;for(int i=1;target.exists();i++){name="import-"+i+"-"+base;target=files.resolve(project,name);}}File temp=File.createTempFile(".studio-import-",".tmp",files.project(project));boolean saved=false;try{try(InputStream in=context.getContentResolver().openInputStream(uri);FileOutputStream out=new FileOutputStream(temp)){if(in==null)throw new IOException("无法读取所选文件");byte[] b=new byte[65536];long total=0;int n;while((n=in.read(b))!=-1){total+=n;if(total>536870912L)throw new IOException("导入文件超过 512 MiB");out.write(b,0,n);}out.getFD().sync();}if(!temp.renameTo(target))throw new IOException("文件导入提交失败");saved=true;}finally{if(!saved)temp.delete();}event.put("path",name).put("project",project);}catch(Exception e){try{event.put("error",e.getMessage());}catch(JSONException ignored){}}try{event.put("type","import");}catch(JSONException ignored){}event(event);});}
    public void exportFile(Uri uri,String project,String path){workers.submit(()->{try{File source=files.resolve(project,path);if(!source.isFile())throw new IOException("请先保存要导出的文件");try(InputStream in=new FileInputStream(source);OutputStream out=context.getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException("无法写入目标");byte[] b=new byte[65536];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}event(new JSONObject().put("type","import").put("path","导出完成"));}catch(Exception e){try{event(new JSONObject().put("type","import").put("error",e.getMessage()));}catch(JSONException ignored){}}});}
    public void cancelAll(){managed.close();for(Command c:commands.values())c.cancel();for(Pty t:terminals.values())t.close();terminals.clear();}
    public void detachTerminals(){for(Pty t:terminals.values())synchronized(t){t.attached=false;}}
    public void close(){closed=true;cancelAll();workers.shutdownNow();Thread cleanup=new Thread(()->{try{while(!workers.awaitTermination(30,TimeUnit.SECONDS)){}if(journal!=null)journal.close();}catch(InterruptedException e){Thread.currentThread().interrupt();}},"studio-close-journal");cleanup.setDaemon(true);cleanup.start();}
}
