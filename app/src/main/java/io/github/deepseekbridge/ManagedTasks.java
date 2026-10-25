package io.github.deepseekbridge;

import org.json.*;
import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/** A service owns each foreground PRoot process after the start RPC has returned. */
final class ManagedTasks implements AutoCloseable {
    interface Child { InputStream stdout(); InputStream stderr(); int pid(); int await() throws Exception; void stop(boolean force); }
    interface Launcher { Child launch(String project,String command,String cwd) throws Exception; }
    private final Launcher launcher; private final Runnable changed;
    private final LinkedHashMap<String,Job> jobs=new LinkedHashMap<>(); private volatile boolean closed;
    ManagedTasks(Launcher launcher,Runnable changed){this.launcher=launcher;this.changed=changed;}
    static String preview(String value)throws IOException{
        if(value==null||value.isEmpty())return "";
        try{URI u=new URI(value);String host=u.getHost();if(!"http".equals(u.getScheme())||u.getUserInfo()!=null||!("127.0.0.1".equals(host)||"localhost".equalsIgnoreCase(host)||"[::1]".equals(host)||"::1".equals(host))||u.getPort()<1||u.getPort()>65535)throw new IOException("预览地址须为本机 HTTP 地址和明确端口");return u.toASCIIString();}
        catch(java.net.URISyntaxException e){throw new IOException("预览地址无效");}
    }
    private static final class Tail implements Runnable {
        final InputStream input; byte[] data=new byte[0]; boolean truncated;
        Tail(InputStream input){this.input=input;}
        public void run(){try(InputStream in=input){byte[] chunk=new byte[8192];int n;while((n=in.read(chunk))!=-1){synchronized(this){int keep=Math.min(data.length,131072-n);byte[] next=new byte[keep+n];System.arraycopy(data,data.length-keep,next,0,keep);System.arraycopy(chunk,0,next,keep,n);truncated|=keep<data.length;data=next;}}}catch(IOException ignored){}}
        synchronized String text(){String text=new String(data,StandardCharsets.UTF_8);return text.substring(Math.max(0,text.length()-16384));}
        synchronized boolean trimmed(){return truncated||data.length>16384;}
    }
    private static final class Job {
        final String id,project,command,cwd,title,url;final long started=System.currentTimeMillis();final CountDownLatch done=new CountDownLatch(1);final Child child;final Tail out,err;
        volatile boolean stopping,finished;volatile int exit;volatile long ended;
        Job(String id,String project,String command,String cwd,String title,String url,Child child){this.id=id;this.project=project;this.command=command;this.cwd=cwd;this.title=title;this.url=url;this.child=child;out=new Tail(child.stdout());err=new Tail(child.stderr());}
        JSONObject json()throws JSONException{return new JSONObject().put("ok",true).put("id",id).put("project",project).put("title",title).put("command",command).put("cwd",cwd).put("previewUrl",url).put("pid",child.pid()).put("state",finished?"exited":stopping?"stopping":"running").put("exitCode",finished?exit:JSONObject.NULL).put("startedAt",started).put("endedAt",finished?ended:JSONObject.NULL).put("durationMs",(finished?ended:System.currentTimeMillis())-started).put("stdout",out.text()).put("stderr",err.text()).put("truncated",out.trimmed()||err.trimmed()).put("notice","任务由 App 服务持有；停止应用服务或系统终止进程后不会自动重启。");}
    }
    private void notifyChanged(){try{changed.run();}catch(RuntimeException ignored){}}
    synchronized int activeCount(){int n=0;for(Job j:jobs.values())if(!j.finished)n++;return n;}
    JSONObject start(String id,String project,JSONObject args)throws Exception{
        String command=args.getString("command"),cwd=args.optString("cwd"),title=args.optString("title","常驻任务"),url=preview(args.optString("preview_url"));
        if(command.isEmpty()||command.length()>32768||command.indexOf('\0')>=0)throw new IOException("命令长度须为 1–32768 且不能含 NUL");
        if(title.length()>80)title=title.substring(0,80);final Job job;
        synchronized(this){
            if(closed)throw new IOException("常驻任务管理器已关闭");Job old=jobs.get(id);
            if(old!=null){if(!old.project.equals(project)||!old.command.equals(command)||!old.cwd.equals(cwd)||!old.url.equals(url))throw new IOException("任务 ID 参数冲突");return old.json();}
            if(activeCount()>=4)throw new IOException("最多同时运行 4 个常驻任务，请先停止不再使用的任务");
            if(jobs.size()>=24){Iterator<Job> iterator=jobs.values().iterator();while(iterator.hasNext()&&jobs.size()>=24)if(iterator.next().finished)iterator.remove();}
            Child child=launcher.launch(project,command,cwd);job=new Job(id,project,command,cwd,title,url,child);jobs.put(id,job);
            Thread out=thread(job.out,"studio-managed-stdout"),err=thread(job.err,"studio-managed-stderr");out.start();err.start();
            thread(()->{try{job.exit=child.await();}catch(Exception e){job.exit=-1;}finally{try{out.join(500);err.join(500);}catch(InterruptedException e){Thread.currentThread().interrupt();}job.ended=System.currentTimeMillis();job.finished=true;job.done.countDown();notifyChanged();}},"studio-managed-wait").start();
        }
        if(closed)throw new IOException("常驻任务启动期间服务已停止");notifyChanged();job.done.await(Math.max(0,Math.min(2000,args.optInt("wait_ms",200))),TimeUnit.MILLISECONDS);return job.json();
    }
    private static Thread thread(Runnable r,String name){Thread t=new Thread(r,name);t.setDaemon(true);return t;}
    private synchronized Job find(String project,String id)throws IOException{Job j=jobs.get(id);if(j==null||!j.project.equals(project))throw new IOException("常驻任务不存在；应用进程被终止后需要重新启动服务");return j;}
    JSONObject status(String project,String id)throws Exception{return find(project,id).json();}
    synchronized JSONObject list(String project)throws JSONException{return list(project,false);}
    synchronized JSONObject list(String project,boolean logs)throws JSONException{JSONArray result=new JSONArray();for(Job j:jobs.values())if(j.project.equals(project)){JSONObject value=j.json();if(!logs){value.remove("stdout");value.remove("stderr");}result.put(value);}return new JSONObject().put("ok",true).put("jobs",result);}
    JSONObject stop(String project,String id)throws Exception{Job j=find(project,id);if(!j.finished){j.stopping=true;j.child.stop(false);notifyChanged();if(!j.done.await(2,TimeUnit.SECONDS)){j.child.stop(true);j.done.await(1,TimeUnit.SECONDS);}}return j.json();}
    void cancelStart(String id){Job job;synchronized(this){job=jobs.get(id);}if(job!=null)thread(()->{try{stop(job.project,id);}catch(Exception ignored){}},"studio-managed-cancel").start();}
    @Override public void close(){closed=true;thread(()->{final List<Job> pending;synchronized(this){pending=new ArrayList<>(jobs.values());}for(Job j:pending)if(!j.finished){j.stopping=true;j.child.stop(false);}for(Job j:pending)if(!j.finished)try{if(!j.done.await(2,TimeUnit.SECONDS))j.child.stop(true);}catch(InterruptedException e){Thread.currentThread().interrupt();break;}},"studio-managed-close").start();}
}
