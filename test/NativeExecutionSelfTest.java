import com.termux.terminal.JNI;
import io.github.deepseekbridge.NativePty;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.lang.reflect.Field;
import java.util.concurrent.*;

/** Runs the same JNI sources against Linux ARM64; Android still needs a device test. */
public final class NativeExecutionSelfTest {
 static int assertions;
 static void check(boolean value,String label){if(!value)throw new AssertionError(label);assertions++;System.out.println("PASS "+label);}
 static FileDescriptor descriptor(int raw)throws Exception{FileDescriptor value=new FileDescriptor();Field field=FileDescriptor.class.getDeclaredField("fd");field.setAccessible(true);field.setInt(value,raw);return value;}
 static final class Capture extends Thread{final InputStream input;final ByteArrayOutputStream bytes=new ByteArrayOutputStream();Capture(InputStream input){this.input=input;}public void run(){try(InputStream s=input){byte[] b=new byte[1024];int n;while((n=s.read(b))!=-1)bytes.write(b,0,n);}catch(IOException ignored){}}String text(){return new String(bytes.toByteArray(),StandardCharsets.UTF_8);}}
 static String[] env={"PATH=/usr/local/bin:/usr/bin:/bin","HOME=/root","LANG=C.UTF-8","TERM=xterm-256color","STUDIO_FIXTURE=带💡"};
 public static void main(String[] args)throws Exception{
  int[] piped=NativePty.spawnPiped("/bin/bash","/tmp",new String[]{"bash","--noprofile","--norc","-c","printf 'OUT💡'; printf 'ERR带' >&2; exit 7"},env);
  check(piped.length==3&&piped[0]>0,"real PID and separate file descriptors");Capture out=new Capture(new FileInputStream(descriptor(piped[1]))),err=new Capture(new FileInputStream(descriptor(piped[2])));out.start();err.start();int code=JNI.waitFor(piped[0]);out.join(5000);err.join(5000);check(code==7,"actual exit code 7");check(out.text().equals("OUT💡"),"standard UTF-8 command arguments");check(err.text().equals("ERR带"),"separate stderr capture");
  int[] envTest=NativePty.spawnPiped("/bin/bash","/tmp",new String[]{"bash","--noprofile","--norc","-c","printf '%s' \"$STUDIO_FIXTURE\""},env);Capture envOut=new Capture(new FileInputStream(descriptor(envTest[1]))),envErr=new Capture(new FileInputStream(descriptor(envTest[2])));envOut.start();envErr.start();check(JNI.waitFor(envTest[0])==0,"environment process exit");envOut.join(5000);envErr.join(5000);check(envOut.text().equals("带💡"),"standard UTF-8 environment values");
  boolean rejected=false;try{NativePty.spawnPiped("/bin/bash","/tmp",new String[]{"bash","-c","bad\u0000argument"},env);}catch(IOException expected){rejected=true;}check(rejected,"NUL arguments rejected before execution");
  int[] pid=new int[1];int fd=JNI.createSubprocess("/bin/bash","/tmp",new String[]{"bash","--noprofile","--norc"},env,pid,24,80,0,0);check(fd>=0&&pid[0]>0,"interactive PTY created");JNI.setPtyWindowSize(fd,40,110,0,0);FileDescriptor shared=descriptor(fd);Capture terminal=new Capture(new FileInputStream(shared));terminal.start();FileOutputStream input=new FileOutputStream(shared);input.write("printf 'PTY_UNICODE_终端💡\\n'; stty size; exit 9\r".getBytes(StandardCharsets.UTF_8));input.flush();check(JNI.waitFor(pid[0])==9,"PTY shell executed input and exited 9");terminal.join(5000);check(terminal.text().contains("40 110"),"PTY window resize reached stty");check(terminal.text().contains("PTY_UNICODE_终端💡"),"PTY Unicode input and output");
  if(args.length>0){
   Path childPid=Paths.get("/tmp/studio-cancel-child.pid");Files.deleteIfExists(childPid);
   int[] p=NativePty.spawnPiped(args[0],"/tmp",new String[]{args[0],"--kill-on-exit","-r","/","-w","/tmp","/bin/sh","-c","sleep 60 & echo $! >/tmp/studio-cancel-child.pid; wait"},env);Capture po=new Capture(new FileInputStream(descriptor(p[1]))),pe=new Capture(new FileInputStream(descriptor(p[2])));po.start();pe.start();for(int i=0;i<250&&!Files.exists(childPid);i++)Thread.sleep(20);check(Files.exists(childPid),"PRoot descendant actually started");String child=new String(Files.readAllBytes(childPid),StandardCharsets.US_ASCII).trim();long start=System.nanoTime();new ProcessBuilder("/bin/kill","-QUIT",Integer.toString(p[0])).start().waitFor();JNI.waitFor(p[0]);check((System.nanoTime()-start)<5_000_000_000L,"SIGQUIT cancels the PRoot operation promptly");po.join(3000);pe.join(3000);Thread.sleep(100);Path stat=Paths.get("/proc",child,"stat");check(!Files.exists(stat)||new String(Files.readAllBytes(stat),StandardCharsets.US_ASCII).contains(") Z "),"cancelled PRoot leaves no running sleep descendant");
  }
  System.out.println("NATIVE_EXECUTION_PASS assertions="+assertions);
 }
}
