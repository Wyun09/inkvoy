package android.database;
import java.sql.*;
public final class Cursor implements AutoCloseable {
 private final ResultSet result;private final PreparedStatement statement;
 public Cursor(ResultSet result,PreparedStatement statement){this.result=result;this.statement=statement;}
 public boolean moveToFirst(){try{return result.next();}catch(java.sql.SQLException e){throw new RuntimeException(e);}}
 public String getString(int index){try{return result.getString(index+1);}catch(java.sql.SQLException e){throw new RuntimeException(e);}}
 public int getInt(int index){try{return result.getInt(index+1);}catch(java.sql.SQLException e){throw new RuntimeException(e);}}
 public void close(){try{result.close();statement.close();}catch(java.sql.SQLException e){throw new RuntimeException(e);}}
}
