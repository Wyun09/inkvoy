package android.database.sqlite;
import java.sql.*;import java.io.File;import android.database.Cursor;
/** Runs production journal SQL against actual SQLite through the host JDBC driver. */
public final class SQLiteDatabase {
 private final Connection connection;private boolean success;
 public static final int CREATE_IF_NECESSARY=0x10000000,ENABLE_WRITE_AHEAD_LOGGING=0x20000000;
 public static final class OpenParams {int flags;String synchronous;public static final class Builder{final OpenParams p=new OpenParams();public Builder addOpenFlags(int flags){p.flags|=flags;return this;}public Builder setSynchronousMode(String value){p.synchronous=value;return this;}public OpenParams build(){return p;}}}
 public static SQLiteDatabase openDatabase(File path,OpenParams params){SQLiteDatabase d=new SQLiteDatabase(path);if((params.flags&ENABLE_WRITE_AHEAD_LOGGING)!=0)d.enableWriteAheadLogging();if("FULL".equals(params.synchronous))d.execSQL("PRAGMA synchronous=FULL");return d;}
 public boolean enableWriteAheadLogging(){try(PreparedStatement p=connection.prepareStatement("PRAGMA journal_mode=WAL");ResultSet r=p.executeQuery()){return r.next()&&r.getString(1).equalsIgnoreCase("wal");}catch(SQLException e){throw new RuntimeException(e);}}
 public SQLiteDatabase(File file){try{connection=DriverManager.getConnection("jdbc:sqlite:"+file.getPath());}catch(SQLException e){throw new RuntimeException(e);}}
 public void execSQL(String sql){execSQL(sql,new Object[0]);}
 public void execSQL(String sql,Object[] values){try(PreparedStatement p=connection.prepareStatement(sql)){for(int i=0;i<values.length;i++)p.setObject(i+1,values[i]);if(p.execute())throw new RuntimeException("Queries can be performed using SQLiteDatabase query or rawQuery methods only.");}catch(SQLException e){throw new RuntimeException(e);}}
 public Cursor rawQuery(String sql,String[] values){try{PreparedStatement p=connection.prepareStatement(sql);if(values!=null)for(int i=0;i<values.length;i++)p.setString(i+1,values[i]);return new Cursor(p.executeQuery(),p);}catch(SQLException e){throw new RuntimeException(e);}}
 public void beginTransaction(){try{connection.setAutoCommit(false);success=false;}catch(SQLException e){throw new RuntimeException(e);}}
 public void setTransactionSuccessful(){success=true;}
 public void endTransaction(){try{if(success)connection.commit();else connection.rollback();connection.setAutoCommit(true);}catch(SQLException e){throw new RuntimeException(e);}}
 public void close(){try{connection.close();}catch(SQLException e){throw new RuntimeException(e);}}
}
