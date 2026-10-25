package io.github.deepseekbridge;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.os.Build;
import org.json.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Persistent unique tool IDs. Unknown effects after interruption are never replayed. */
public final class ToolJournal {
    private final SQLiteDatabase db;
    public ToolJournal(Context context){
        if(Build.VERSION.SDK_INT>=28){
            java.io.File path=context.getDatabasePath("studio-tool-journal.db"),parent=path.getParentFile();
            if(!parent.isDirectory()&&!parent.mkdirs())throw new IllegalStateException("无法创建工具日志目录");
            db=SQLiteDatabase.openDatabase(path,new SQLiteDatabase.OpenParams.Builder()
                .addOpenFlags(SQLiteDatabase.CREATE_IF_NECESSARY|SQLiteDatabase.ENABLE_WRITE_AHEAD_LOGGING)
                .setSynchronousMode("FULL").build());
        }else{
            db=context.openOrCreateDatabase("studio-tool-journal.db",Context.MODE_PRIVATE,null);
            db.enableWriteAheadLogging();
            // All journal writes use the primary connection on Android 8.x.
            db.execSQL("PRAGMA synchronous=FULL");
        }
        try{
            db.execSQL("CREATE TABLE IF NOT EXISTS calls (id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,state TEXT NOT NULL,result TEXT,updated INTEGER NOT NULL)");
            db.execSQL("CREATE TABLE IF NOT EXISTS cancellations (id TEXT PRIMARY KEY,updated INTEGER NOT NULL)");
            db.execSQL("UPDATE calls SET state='interrupted' WHERE state IN ('accepted','running')");
        }catch(RuntimeException error){db.close();throw error;}
    }
    public synchronized JSONObject claim(String id,String request)throws Exception{
        if(id==null||!id.matches("[a-zA-Z0-9_-]{1,160}"))throw new IOException("Invalid tool ID");
        String hash=RuntimeInstaller.hex(MessageDigest.getInstance("SHA-256").digest(request.getBytes(StandardCharsets.UTF_8)));
        db.beginTransaction();try{
            try(Cursor c=db.rawQuery("SELECT fingerprint,state,result FROM calls WHERE id=?",new String[]{id})){
                if(c.moveToFirst()){
                    if(!hash.equals(c.getString(0)))throw new IOException("工具 ID 与原参数冲突，未执行");
                    String state=c.getString(1);if(state.equals("completed"))return c.getString(2)==null?new JSONObject().put("ok",false).put("resultExpired",true).put("error","该工具 ID 已有终态记录，旧输出已回收；未重复执行。请检查项目文件。"):new JSONObject(c.getString(2));
                    throw new IOException(state.equals("running")?"工具仍在执行，未重复启动":"上次工具的执行结果未确认，请先检查文件和进程；未自动重跑");
                }
            }
            try(Cursor c=db.rawQuery("SELECT COUNT(*) FROM calls",null)){c.moveToFirst();if(c.getInt(0)>=5000)throw new IOException("工具日志已达 5000 条，请导出旧项目后清理应用数据；为保持去重，不自动删除执行身份");}
            if(cancelled(id)){JSONObject result=new JSONObject().put("ok",false).put("executed",false).put("cancelled",true).put("error","工具在执行前已取消");db.execSQL("INSERT INTO calls(id,fingerprint,state,result,updated) VALUES(?,?,'completed',?,?)",new Object[]{id,hash,result.toString(),System.currentTimeMillis()});db.setTransactionSuccessful();return result;}
            db.execSQL("INSERT INTO calls(id,fingerprint,state,updated) VALUES(?,?,'accepted',?)",new Object[]{id,hash,System.currentTimeMillis()});db.setTransactionSuccessful();return null;
        }finally{db.endTransaction();}
    }
    public synchronized void running(String id){db.execSQL("UPDATE calls SET state='running',updated=? WHERE id=?",new Object[]{System.currentTimeMillis(),id});}
    public synchronized void finish(String id,JSONObject result){db.execSQL("UPDATE calls SET state='completed',result=?,updated=? WHERE id=?",new Object[]{result.toString(),System.currentTimeMillis(),id});db.execSQL("UPDATE calls SET result=NULL WHERE state='completed' AND id NOT IN (SELECT id FROM calls ORDER BY updated DESC,rowid DESC LIMIT 128)");}
    public synchronized boolean cancelled(String id){try(Cursor c=db.rawQuery("SELECT id FROM cancellations WHERE id=?",new String[]{id})){return c.moveToFirst();}}
    public synchronized void cancel(String id)throws IOException{if(id==null||!id.matches("[a-zA-Z0-9_-]{1,160}"))throw new IOException("Invalid tool ID");db.execSQL("INSERT OR IGNORE INTO cancellations(id,updated) VALUES(?,?)",new Object[]{id,System.currentTimeMillis()});}
    public synchronized void close(){db.close();}
}
