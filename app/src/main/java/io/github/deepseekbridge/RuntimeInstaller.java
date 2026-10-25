package io.github.deepseekbridge;

import android.content.Context;
import android.os.Build;
import android.os.StatFs;
import android.system.Os;
import android.system.ErrnoException;
import android.system.OsConstants;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.GZIPInputStream;

/** Installs only the signed APK's pinned, offline image. No network installs. */
public final class RuntimeInstaller {
    public interface Progress { void update(JSONObject state); }
    private final Context context;
    private final File environments;
    private final Progress progress;
    private final RuntimeAssets assets;
    private JSONObject manifest;
    private volatile String state = "{}";
    private File root;
    public RuntimeInstaller(Context context, Progress progress) {
        this.context=context;this.progress=progress;environments=new File(context.getFilesDir(),"environments");
        assets=new RuntimeAssets(context);
        loadManifest();
    }
    private boolean loadManifest() {
        try {
            JSONObject loaded=new JSONObject(read(assets.open("manifest.json"),262144));
            String version=loaded.getString("id");if(!version.matches("[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}")||!loaded.getString("sha256").matches("[a-f0-9]{64}")||loaded.getLong("unpackedBytes")<1||loaded.getLong("compressedBytes")<1)throw new IOException("Invalid image manifest");
            loaded.getJSONArray("tools");manifest=loaded;
            root=new File(environments,version);
            boolean installed=hasReadyMarker();
            setState(new JSONObject().put("ready",installed).put("installed",installed).put("phase",installed?"installed":"idle").put("image",version).put("assetSource",assets.source()).put("tools",manifest.getJSONArray("tools")).put("deviceAbis",new JSONArray(Arrays.asList(Build.SUPPORTED_ABIS))));
            return true;
        } catch(Exception e){manifest=null;root=null;setError("manifest_unavailable","读取离线镜像清单失败",e);return false;}
    }
    public JSONObject status(){try{return new JSONObject(state);}catch(JSONException e){return new JSONObject();}}
    public File root(){return root;}
    public JSONObject manifest(){return manifest;}
    private void setState(JSONObject value){state=value.toString();try{if(progress!=null)progress.update(status());}catch(RuntimeException ignored){/* A UI listener cannot invalidate an installed image. */}}
    public void setError(String message){setError("runtime_failed",message,null);}
    private void setError(String code,String message,Exception cause){try{JSONObject s=status();String detail=cause==null?"":cause.getClass().getSimpleName()+": "+String.valueOf(cause.getMessage());s.put("error",message+(detail.isEmpty()?"":"："+detail)).put("errorCode",code).put("phase","failed").put("installing",false).put("ready",false).put("assetSource",assets.source());s.remove("message");s.remove("verified");setState(s);}catch(JSONException ignored){}}
    public void booted(){try{JSONObject s=status();s.put("ready",true).put("installed",true).put("phase","ready").put("message","Debian 已启动，可打开终端或运行自检");s.remove("error");s.remove("errorCode");setState(s);}catch(JSONException ignored){}}
    public synchronized void verified(boolean value){try{JSONObject s=status();s.put("verified",value);setState(s);}catch(JSONException ignored){}}
    private void report(int percent,String message)throws JSONException {JSONObject s=status();s.put("installing",true).put("phase",percent<5?"verifying":"extracting").put("progress",percent).put("message",message);s.remove("error");s.remove("errorCode");setState(s);}
    private boolean hasReadyMarker(){if(root==null||manifest==null)return false;try{return read(new FileInputStream(new File(root,".studio-image-ready")),256).trim().equals(manifest.getString("sha256"));}catch(Exception ignored){return false;}}
    public synchronized File ensure()throws Exception {
        if((manifest==null||root==null)&&!loadManifest())throw new IOException(status().optString("error","读取离线镜像失败"));
        String step="preflight";
        try {
            if(!Arrays.asList(Build.SUPPORTED_ABIS).contains("arm64-v8a"))throw new IOException("此离线镜像仅支持 ARM64；当前系统 ABI："+Arrays.toString(Build.SUPPORTED_ABIS));
            if(hasReadyMarker())return root;
            if(!environments.isDirectory()&&!environments.mkdirs())throw new IOException("无法创建环境目录");
            long unpacked=manifest.getLong("unpackedBytes");
            File stage=new File(environments,manifest.getString("id")+".staging");
            removeStage(stage);
            long required=manifest.optLong("requiredFreeBytes",unpacked+manifest.optInt("files",200000)*4096L+268435456L);
            long available=new StatFs(environments.getPath()).getAvailableBytes();
            if(available<required)throw new IOException("手机可用空间 "+(available/1048576)+" MiB，初始化至少需要 "+(required/1048576)+" MiB");
            step="image_integrity";
            report(0,"校验安装包中的离线镜像…");
            MessageDigest digest=MessageDigest.getInstance("SHA-256");long bytes=0;byte[] buffer=new byte[131072];
            try(InputStream input=assets.open("debian-arm64.tar.gz")){int n;while((n=input.read(buffer))!=-1){if(Thread.currentThread().isInterrupted())throw new IOException("环境初始化已取消");digest.update(buffer,0,n);bytes+=n;}}
            if(bytes!=manifest.getLong("compressedBytes")||!hex(digest.digest()).equals(manifest.getString("sha256")))throw new IOException("离线镜像完整性校验失败");
            if(!stage.mkdirs())throw new IOException("无法创建环境临时目录");step="image_extract";
            report(5,"解压 Debian 与预装工具；项目文件保留在独立目录…");
            int copiedLinks;
            try(InputStream input=new GZIPInputStream(assets.open("debian-arm64.tar.gz"),131072)) {
                copiedLinks=extract(input,stage,unpacked+10485760L,manifest.optInt("maxArchiveEntries",manifest.optInt("files",200000)+2000),(done)->{try{report(5+(int)Math.min(90,done*90/Math.max(1,unpacked)),"正在解压 "+done/1048576+" / "+unpacked/1048576+" MiB");}catch(JSONException ignored){}});
            }
            try(FileOutputStream output=new FileOutputStream(new File(stage,".studio-image-ready"))){output.write(manifest.getString("sha256").getBytes(StandardCharsets.UTF_8));output.getFD().sync();}
            if(root.exists())throw new IOException("已有不完整环境；为保留现场，未覆盖该目录");
            if(!stage.renameTo(root))throw new IOException("无法提交离线环境");
            JSONObject s=status();s.put("ready",true).put("installed",true).put("phase","installed").put("installing",false).put("progress",100).put("hardLinkCopies",copiedLinks).put("message","离线镜像已解压，正在验证 Debian 启动…");setState(s);return root;
        }catch(Exception error){setError(step,"离线环境初始化失败",error);throw new IOException(status().optString("error"),error);}
    }
    private void removeStage(File target)throws IOException {
        File parent=target.getParentFile().getCanonicalFile();if(!parent.equals(environments.getCanonicalFile())||!target.getName().endsWith(".staging"))throw new IOException("Unsafe staging directory");
        removeTree(target);
    }
    private static void removeTree(File f)throws IOException {if(!Files.isSymbolicLink(f.toPath())&&f.isDirectory()){File[] children=f.listFiles();if(children==null)throw new IOException("Cannot inspect staging directory");for(File c:children)removeTree(c);}if((f.exists()||Files.isSymbolicLink(f.toPath()))&&!f.delete())throw new IOException("Cannot clean staging entry");}
    interface BytesProgress{void update(long bytes);}
    static final class Link{File file;String target;boolean symbolic;int mode;Link(File f,String t,boolean s,int m){file=f;target=t;symbolic=s;mode=m;}}
    interface HardLink { void create(String source,String destination)throws Exception; }
    /** Bounded tar reader; links are created only after all file writes finish. */
    static int extract(InputStream in,File directory,long limit,int maxFiles,BytesProgress progress)throws Exception {
        return extract(in,directory,limit,maxFiles,progress,Os::link);
    }
    static int extract(InputStream in,File directory,long limit,int maxFiles,BytesProgress progress,HardLink hardLink)throws Exception {
        final String prefix=directory.getCanonicalPath()+File.separator;byte[] header=new byte[512],buffer=new byte[65536];long total=0,lastReport=0;int count=0;String longName=null,longLink=null;Map<String,String> pax=new HashMap<>();List<Link> links=new ArrayList<>();
        for(;;){if(Thread.currentThread().isInterrupted())throw new IOException("环境初始化已取消");readFully(in,header,512);boolean zero=true;for(byte b:header)if(b!=0){zero=false;break;}if(zero)break;
            long check=octal(header,148,8),sum=0;for(int i=0;i<512;i++)sum+=(i>=148&&i<156)?32:header[i]&255;if(check!=sum)throw new IOException("Invalid tar checksum");
            if(++count>maxFiles)throw new IOException("Too many archive entries");
            long size=octal(header,124,12);int mode=(int)octal(header,100,8);char type=(char)header[156];String name=text(header,0,100),pre=text(header,345,155);if(!pre.isEmpty())name=pre+"/"+name;
            if(type=='x'||type=='g'||type=='L'||type=='K') {
                if(size>1048576)throw new IOException("Oversized tar metadata");byte[] value=new byte[(int)size];readFully(in,value,value.length);skip(in,(512-size%512)%512);
                if(type=='L')longName=new String(value,StandardCharsets.UTF_8).replace("\0","").trim();else if(type=='K')longLink=new String(value,StandardCharsets.UTF_8).replace("\0","").trim();else if(type=='x')pax=parsePax(value);continue;
            }
            if(longName!=null){name=longName;longName=null;}if(pax.containsKey("path"))name=pax.get("path");
            String target=longLink!=null?longLink:text(header,157,100);longLink=null;if(pax.containsKey("linkpath"))target=pax.get("linkpath");pax.clear();
            while(name.startsWith("./"))name=name.substring(2);if(name.isEmpty()||name.equals(".")){skip(in,size+(512-size%512)%512);continue;}
            if(name.startsWith("/")||name.indexOf('\0')>=0||name.indexOf('\\')>=0||Arrays.asList(name.split("/")).contains(".."))throw new IOException("Unsafe tar path");
            File out=new File(directory,name);if(!out.getCanonicalPath().startsWith(prefix))throw new IOException("Archive escapes destination");
            if(size<0||size>limit-total)throw new IOException("Expanded image exceeds manifest bound");total+=size;
            File parent=out.getParentFile();if(!parent.isDirectory()&&!parent.mkdirs())throw new IOException("Cannot create archive parent");
            if(type=='5'){if(!out.isDirectory()&&!out.mkdirs())throw new IOException("Cannot create archive directory");Os.chmod(out.getPath(),mode&01777);skip(in,size);}
            else if(type=='2'||type=='1'){links.add(new Link(out,target,type=='2',mode&0777));skip(in,size);}
            else if(type==0||type=='0'){try(FileOutputStream stream=new FileOutputStream(out)){long remaining=size;while(remaining>0){if(Thread.currentThread().isInterrupted())throw new IOException("环境初始化已取消");int n=in.read(buffer,0,(int)Math.min(buffer.length,remaining));if(n<0)throw new EOFException();stream.write(buffer,0,n);remaining-=n;}}Os.chmod(out.getPath(),mode&0777);}
            else if(type=='3'||type=='4'||type=='6'){skip(in,size);/* /dev is bound at runtime. */}
            else throw new IOException("Unsupported tar entry type "+type);
            skip(in,(512-size%512)%512);if(total-lastReport>8388608){progress.update(total);lastReport=total;}
        }
        int copiedLinks=0;List<Link> pending=new ArrayList<>();for(Link l:links)if(!l.symbolic)pending.add(l);
        while(!pending.isEmpty()) {
            int resolved=0;
            for(Iterator<Link> iterator=pending.iterator();iterator.hasNext();) {
                if(Thread.currentThread().isInterrupted())throw new IOException("环境初始化已取消");
                Link l=iterator.next();File target=new File(directory,l.target);
                if(l.target.isEmpty()||l.target.startsWith("/")||l.target.indexOf('\\')>=0||l.target.indexOf('\0')>=0||Arrays.asList(l.target.split("/")).contains("..")||!target.getCanonicalPath().startsWith(prefix)||Files.isSymbolicLink(target.toPath()))throw new IOException("Unsafe hard link target: "+l.target);
                if(!target.exists())continue;
                if(!target.isFile()||!l.file.getCanonicalPath().startsWith(prefix)||l.file.exists()||Files.isSymbolicLink(l.file.toPath()))throw new IOException("Unsafe hard link destination: "+l.file.getName());
                try {hardLink.create(target.getPath(),l.file.getPath());}
                catch(ErrnoException denied) {
                    int code=denied.errno;
                    if(code!=OsConstants.EACCES&&code!=OsConstants.EPERM&&code!=OsConstants.EXDEV&&code!=OsConstants.EOPNOTSUPP&&code!=OsConstants.EMLINK)throw denied;
                    // Some Android kernels/SELinux policies deny link(2) even in app-private storage.
                    // A bounded regular copy preserves the immutable image's content and executable mode.
                    long length=target.length();if(length>limit-total)throw new IOException("Expanded image exceeds manifest bound while copying hard links",denied);
                    try{Files.copy(target.toPath(),l.file.toPath());Os.chmod(l.file.getPath(),l.mode);}catch(Exception copyError){throw new IOException("Cannot copy image link: "+l.target+" -> "+l.file.getName(),copyError);}total+=length;copiedLinks++;
                }
                iterator.remove();resolved++;
            }
            if(resolved==0)throw new IOException("Missing or cyclic hard link target: "+pending.get(0).target);
        }
        for(Link l:links)if(l.symbolic){if(l.target.indexOf('\0')>=0||l.target.isEmpty())throw new IOException("Invalid symlink");Os.symlink(l.target,l.file.getPath());}
        progress.update(total);
        return copiedLinks;
    }
    private static Map<String,String> parsePax(byte[] data)throws IOException{Map<String,String> values=new HashMap<>();int offset=0;while(offset<data.length){int space=offset;while(space<data.length&&data[space]!=' ')space++;if(space==data.length)throw new IOException("Invalid PAX");int size=Integer.parseInt(new String(data,offset,space-offset,StandardCharsets.US_ASCII));if(size<=space-offset+1||size>data.length-offset)throw new IOException("Invalid PAX size");String entry=new String(data,space+1,offset+size-space-2,StandardCharsets.UTF_8);int eq=entry.indexOf('=');if(eq>0)values.put(entry.substring(0,eq),entry.substring(eq+1));offset+=size;}return values;}
    private static long octal(byte[] b,int o,int n)throws IOException{String s=text(b,o,n).trim();if(s.isEmpty())return 0;try{return Long.parseLong(s,8);}catch(Exception e){throw new IOException("Invalid tar number");}}
    private static String text(byte[] b,int o,int n){int end=o;while(end<o+n&&b[end]!=0)end++;return new String(b,o,end-o,StandardCharsets.UTF_8);}
    private static void readFully(InputStream in,byte[] b,int length)throws IOException{int offset=0;while(offset<length){int n=in.read(b,offset,length-offset);if(n<0)throw new EOFException();offset+=n;}}
    private static void skip(InputStream in,long size)throws IOException{byte[] b=new byte[8192];while(size>0){int n=in.read(b,0,(int)Math.min(b.length,size));if(n<0)throw new EOFException();size-=n;}}
    static String read(InputStream in,int limit)throws IOException{try(InputStream s=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=s.read(b))!=-1){if(out.size()+n>limit)throw new IOException("Read limit exceeded");out.write(b,0,n);}return new String(out.toByteArray(),StandardCharsets.UTF_8);}}
    static String hex(byte[] bytes){StringBuilder s=new StringBuilder();for(byte b:bytes)s.append(String.format(Locale.ROOT,"%02x",b&255));return s.toString();}
}
