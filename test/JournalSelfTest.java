import io.github.deepseekbridge.ToolJournal;
import android.content.Context;
import org.json.*;
import java.io.*;
import java.nio.file.*;
import java.util.concurrent.atomic.AtomicInteger;
public final class JournalSelfTest {
 static int checks;interface Work{void run()throws Exception;}
 static void check(boolean value,String label){if(!value)throw new AssertionError(label);checks++;}
 static void rejects(Work work)throws Exception{try{work.run();throw new AssertionError("Operation unexpectedly allowed");}catch(IOException expected){checks++;}}
 public static void main(String[] args)throws Exception{
  for(int sdk:new int[]{26,33}){android.os.Build.VERSION.SDK_INT=sdk;run();}
  System.out.println("JOURNAL_SQLITE_PASS assertions="+checks+" API=26,33");
 }
 private static void run()throws Exception{
  Context context=new Context(Files.createTempDirectory("studio-journal-").toFile());
  android.database.sqlite.SQLiteDatabase legacy=context.openOrCreateDatabase("legacy.db",0,null);
  try{legacy.execSQL("PRAGMA journal_mode=WAL");throw new AssertionError("Android execSQL must reject row-returning PRAGMA");}catch(RuntimeException expected){check(expected.getMessage().contains("Queries can be performed"),"old startup statement reproduces Android API rejection");}finally{legacy.close();}
  ToolJournal journal=new ToolJournal(context);final ToolJournal first=journal;
  check(journal.claim("once","request")==null,"first claim");journal.running("once");journal.finish("once",new JSONObject().put("ok",true).put("stdout","actual result").put("exitCode",7));check(journal.claim("once","request").getInt("exitCode")==7,"exact saved exit code");rejects(()->first.claim("once","changed request"));
  check(journal.claim("in-flight","pending")==null,"active claim");journal.running("in-flight");rejects(()->first.claim("in-flight","pending"));
  journal.cancel("before-claim");check(journal.claim("before-claim","cancelled request").getBoolean("cancelled"),"pre-start cancellation persisted");check(!journal.claim("before-claim","cancelled request").getBoolean("executed"),"pre-start cancellation has no effects");
  journal.cancel("once");check(journal.claim("once","request").getString("stdout").equals("actual result"),"late cancel cannot erase completed facts");
  journal.close();journal=new ToolJournal(context);final ToolJournal recovered=journal;rejects(()->recovered.claim("in-flight","pending"));check(journal.cancelled("before-claim"),"cancellation survives restart");
  for(int i=0;i<140;i++){String id="retention-"+i;journal.claim(id,"req-"+i);journal.finish(id,new JSONObject().put("ok",true).put("stdout","result "+i));}
  check(journal.claim("retention-0","req-0").getBoolean("resultExpired"),"old output expires without allowing a second execution");check(journal.claim("retention-139","req-139").getString("stdout").equals("result 139"),"recent output retained");rejects(()->recovered.claim("retention-0","conflicting fingerprint"));
  AtomicInteger accepted=new AtomicInteger();Runnable same=()->{try{if(recovered.claim("concurrent","same")==null)accepted.incrementAndGet();}catch(Exception expected){}};Thread a=new Thread(same),b=new Thread(same);a.start();b.start();a.join();b.join();check(accepted.get()==1,"concurrent duplicate accepted once");rejects(()->recovered.claim("bad id","x"));
  recovered.close();
 }
}
