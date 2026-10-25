package io.github.deepseekbridge;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.CountDownLatch;
import org.junit.Test;
import static org.junit.Assert.*;

public class CommandCaptureTest {
 @Test public void snapshotsHoldIncompleteUtf8AndTheFinalOutputIsExact()throws Exception{
  PipedOutputStream writer=new PipedOutputStream();CommandCapture capture=new CommandCapture(new PipedInputStream(writer));Thread reader=new Thread(capture);reader.start();
  try{byte[] text="中文🙂".getBytes(StandardCharsets.UTF_8);writer.write(text,0,1);writer.flush();waitRevision(capture,1);assertEquals("",capture.snapshot().text);
   writer.write(text,1,text.length-1);writer.close();reader.join(2000);assertFalse(reader.isAlive());assertEquals("中文🙂",capture.snapshot().text);assertEquals("中文🙂",capture.text());assertFalse(capture.truncated());
  }finally{writer.close();reader.join(2000);}
 }
 @Test public void largePipesAreDrainedAndBothPreviewAndResultHaveExplicitLimits(){
  byte[] bytes=new byte[CommandCapture.LIMIT*3];Arrays.fill(bytes,(byte)'a');CommandCapture capture=new CommandCapture(new ByteArrayInputStream(bytes));capture.run();
  assertEquals(CommandCapture.LIMIT,capture.text().length());assertEquals(CommandCapture.PREVIEW,capture.snapshot().text.length());assertTrue(capture.truncated());assertTrue(capture.snapshot().truncated);assertEquals(capture.snapshot().revision,capture.snapshot().revision);
 }
 @Test public void previewDoesNotStartInTheMiddleOfAnEmoji(){
  StringBuilder text=new StringBuilder("a🙂");for(int i=0;i<CommandCapture.PREVIEW-1;i++)text.append('b');CommandCapture capture=new CommandCapture(new ByteArrayInputStream(text.toString().getBytes(StandardCharsets.UTF_8)));capture.run();
  assertFalse(Character.isLowSurrogate(capture.snapshot().text.charAt(0)));assertFalse(capture.snapshot().text.contains("�"));assertTrue(capture.snapshot().truncated);assertEquals(text.toString(),capture.text());
 }
 private static void waitRevision(CommandCapture capture,long revision)throws Exception{long end=System.nanoTime()+2000000000L;while(capture.snapshot().revision<revision&&System.nanoTime()<end)Thread.yield();assertTrue(capture.snapshot().revision>=revision);}
}
