package io.github.deepseekbridge;
import android.app.Application;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import org.json.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class FileRevisionsTest {
    File root;ProjectFiles files;FileRevisions revisions;String project="p-test";
    @Before public void setup()throws Exception{root=Files.createTempDirectory(RuntimeEnvironment.getApplication().getFilesDir().toPath(),"revisions-").toFile();files=new ProjectFiles(new File(root,"projects"));revisions=new FileRevisions(files,new File(root,"history"));}
    private String write(String path,String content)throws Exception{return revisions.write(project,path,content).getJSONObject("change").getString("id");}
    private String text(String path)throws Exception{return files.read(project,path,0,1048576).getString("content");}
    @Test public void realBeforeAndAfterAndCanonicalPathSurviveRestart()throws Exception{
        files.write(project,"src/test.txt","before\n");String id=write("/workspace/src/test.txt","after\n");revisions=new FileRevisions(files,new File(root,"history"));JSONObject change=revisions.get(project,id);assertEquals("src/test.txt",change.getString("path"));assertEquals("before\n",change.getString("before"));assertEquals("after\n",change.getString("after"));assertTrue(change.getBoolean("canRevert"));
    }
    @Test public void revertExistingAndNewFilesIsIdempotent()throws Exception{
        files.write(project,"existing","old");String id=write("existing","new");revisions.revert(project,id);assertEquals("old",text("existing"));assertTrue(revisions.revert(project,id).getBoolean("alreadyReverted"));assertTrue(revisions.get(project,id).getBoolean("reverted"));
        String added=write("new-file","hello");revisions.revert(project,added);assertFalse(files.resolve(project,"new-file").exists());assertEquals("old",text("existing"));
    }
    @Test public void laterEditsAreNeverOverwritten()throws Exception{
        files.write(project,"file","old");String id=write("file","assistant");files.write(project,"file","user edit");assertFalse(revisions.get(project,id).getBoolean("canRevert"));try{revisions.revert(project,id);fail("Overwrote later edit");}catch(IOException expected){}assertEquals("user edit",text("file"));
    }
    @Test public void olderSnapshotBecomesRevertibleAfterNewestIsReverted()throws Exception{
        files.write(project,"file","a");String a=write("file","b"),b=write("file","c");assertFalse(revisions.get(project,a).getBoolean("canRevert"));revisions.revert(project,b);assertTrue(revisions.get(project,a).getBoolean("canRevert"));revisions.revert(project,a);assertEquals("a",text("file"));
    }
    @Test public void invalidAndCrossProjectIdsAreRejected()throws Exception{
        String id=write("file","text");for(String bad:new String[]{"../escape","r-..",id+"/metadata.json"})try{revisions.get(project,bad);fail("Invalid ID");}catch(IOException expected){}
        try{revisions.get("p-other",id);fail("Cross project");}catch(IOException expected){}
        try{write("../escape","bad");fail("Traversal");}catch(IOException expected){}
    }
    @Test public void corruptSnapshotCannotRevertFile()throws Exception{
        files.write(project,"file","old");String id=write("file","new");Files.write(new File(root,"history/"+project+"/"+id+"/before.bin").toPath(),"tampered".getBytes(StandardCharsets.UTF_8));try{revisions.revert(project,id);fail("Corrupt snapshot");}catch(IOException expected){}assertEquals("new",text("file"));
    }
    @Test public void binaryOriginalCanBeRestoredWithoutPretendingTextDiff()throws Exception{
        File binary=files.resolve(project,"data");Files.write(binary.toPath(),new byte[]{1,0,2});String id=write("data","text");assertFalse(revisions.get(project,id).getBoolean("previewable"));revisions.revert(project,id);assertArrayEquals(new byte[]{1,0,2},Files.readAllBytes(binary.toPath()));
    }
    @Test public void unchangedWriteHasNoSnapshotAndLargeEditsAreBounded()throws Exception{
        files.write(project,"file","same");assertTrue(revisions.write(project,"file","same").getBoolean("unchanged"));assertFalse(new File(root,"history").exists());
        char[] huge=new char[2097153];java.util.Arrays.fill(huge,'a');try{write("file",new String(huge));fail("Unbounded edit");}catch(IOException expected){}assertEquals("same",text("file"));
    }
    @Test public void pendingCommitAndInterruptedRevertRecoverByHashes()throws Exception{
        files.write(project,"file","old");String id=write("file","new");File m=new File(root,"history/"+project+"/"+id+"/metadata.json");JSONObject meta=new JSONObject(new String(Files.readAllBytes(m.toPath()),StandardCharsets.UTF_8));meta.put("committed",false);Files.write(m.toPath(),meta.toString().getBytes(StandardCharsets.UTF_8));assertTrue(revisions.get(project,id).getBoolean("committed"));
        meta.put("committed",true).put("revertRequested",true);Files.write(m.toPath(),meta.toString().getBytes(StandardCharsets.UTF_8));files.write(project,"file","old");assertTrue(revisions.get(project,id).getBoolean("reverted"));assertTrue(revisions.revert(project,id).getBoolean("alreadyReverted"));
    }
    @Test public void retentionExpiresOnlyOldAppSnapshots()throws Exception{
        String first=write("file","0"),latest=first;for(int i=1;i<=65;i++)latest=write("file",String.valueOf(i));
        assertTrue(new File(root,"history/"+project).listFiles().length<=64);try{revisions.get(project,first);fail("Old snapshot not expired");}catch(IOException expected){}assertTrue(revisions.get(project,latest).getBoolean("canRevert"));assertEquals("65",text("file"));
    }
}
