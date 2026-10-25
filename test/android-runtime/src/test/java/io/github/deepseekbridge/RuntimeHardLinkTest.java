package io.github.deepseekbridge;

import android.app.Application;
import android.system.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Arrays;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk={26,33},manifest=Config.NONE,application=Application.class)
public class RuntimeHardLinkTest {
    private File output;
    @Before public void setup()throws Exception {output=Files.createTempDirectory(RuntimeEnvironment.getApplication().getFilesDir().toPath(),"links-").toFile();}
    private static void text(byte[] h,int offset,int length,String value){byte[] b=value.getBytes(StandardCharsets.UTF_8);System.arraycopy(b,0,h,offset,Math.min(length,b.length));}
    private static byte[] entry(String name,String content,char type,String target)throws Exception {
        byte[] h=new byte[512],data=content.getBytes(StandardCharsets.UTF_8);text(h,0,100,name);text(h,100,8,"0000755");text(h,124,12,String.format("%011o",data.length));Arrays.fill(h,148,156,(byte)' ');h[156]=(byte)type;text(h,157,100,target);long sum=0;for(byte b:h)sum+=b&255;text(h,148,8,String.format("%06o",sum));ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(h);out.write(data);out.write(new byte[(512-data.length%512)%512]);return out.toByteArray();
    }
    private byte[] tar(String target,boolean chain)throws Exception {ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(entry("bin/tool","#!/bin/sh\necho ok\n",'0',""));if(chain)out.write(entry("bin/last","",'1',"bin/alias"));out.write(entry("bin/alias","",'1',target));out.write(new byte[1024]);return out.toByteArray();}
    private int extract(byte[] data,long limit,int errno)throws Exception {return RuntimeInstaller.extract(new ByteArrayInputStream(data),output,limit,30,b->{},(a,b)->{throw new ErrnoException("link",errno);});}
    @Test public void eaccesAndEpermCopyExecutableContentsAndResolveForwardChains()throws Exception {
        assertEquals(2,extract(tar("bin/tool",true),1000,OsConstants.EACCES));
        assertArrayEquals(Files.readAllBytes(new File(output,"bin/tool").toPath()),Files.readAllBytes(new File(output,"bin/last").toPath()));
        assertFalse(Files.isSymbolicLink(new File(output,"bin/alias").toPath()));
        assertTrue(new File(output,"bin/alias").canExecute());
        output=Files.createTempDirectory(output.toPath(),"eperm-").toFile();extract(tar("bin/tool",false),1000,OsConstants.EPERM);
        assertTrue(new File(output,"bin/alias").isFile());
    }
    @Test public void noSpaceIsNotMaskedAsPermissionFallback()throws Exception {
        try{extract(tar("bin/tool",false),1000,OsConstants.ENOSPC);fail("ENOSPC swallowed");}catch(ErrnoException expected){assertEquals(OsConstants.ENOSPC,expected.errno);}
        assertFalse(new File(output,"bin/alias").exists());
    }
    @Test public void copiedBytesRemainInsideExtractionLimit()throws Exception {
        try{extract(tar("bin/tool",false),20,OsConstants.EACCES);fail("Copy expansion unbounded");}catch(IOException expected){assertTrue(expected.getMessage().contains("manifest bound"));}
    }
    @Test public void missingAndEscapingTargetsStillFail()throws Exception {
        for(String target:new String[]{"../outside","/etc/passwd","bin/missing"}){try{extract(tar(target,false),1000,OsConstants.EACCES);fail("Unsafe link accepted");}catch(IOException expected){assertFalse(new File(output,"bin/alias").exists());}}
    }
}
