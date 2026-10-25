package io.github.deepseekbridge;

import java.io.*;
import java.nio.*;
import java.nio.charset.*;

/** Bounded pipe capture. Partial UTF-8 characters are held until the next snapshot. */
final class CommandCapture implements Runnable {
    static final int LIMIT=131072, PREVIEW=16000;
    private final InputStream input;
    private final ByteArrayOutputStream bytes=new ByteArrayOutputStream();
    private boolean truncated,complete;
    private long revision;
    CommandCapture(InputStream input){this.input=input;}
    public void run(){
        try(InputStream stream=input){byte[] buffer=new byte[8192];int count;
            while((count=stream.read(buffer))!=-1){synchronized(this){
                int keep=Math.min(count,LIMIT-bytes.size());boolean cut=keep<count;
                if(keep>0)bytes.write(buffer,0,keep);
                if(keep>0||cut&&!truncated)revision++;
                truncated|=cut;
            }}
        }catch(IOException ignored){}finally{synchronized(this){complete=true;revision++;}}
    }
    synchronized String text(){return new String(bytes.toByteArray(),StandardCharsets.UTF_8);}
    synchronized boolean truncated(){return truncated;}
    synchronized Snapshot snapshot(){
        byte[] raw=bytes.toByteArray();CharBuffer chars=CharBuffer.allocate(raw.length+1);
        CharsetDecoder decoder=StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPLACE).onUnmappableCharacter(CodingErrorAction.REPLACE);
        decoder.decode(ByteBuffer.wrap(raw),chars,complete);chars.flip();String text=chars.toString();
        int from=Math.max(0,text.length()-PREVIEW);
        if(from>0&&Character.isLowSurrogate(text.charAt(from)))from++;
        return new Snapshot(text.substring(from),truncated||from>0,revision);
    }
    static final class Snapshot {
        final String text;final boolean truncated;final long revision;
        Snapshot(String text,boolean truncated,long revision){this.text=text;this.truncated=truncated;this.revision=revision;}
    }
}
