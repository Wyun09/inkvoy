package io.github.deepseekbridge;
/** Exposes the real command PID without hidden Android Process APIs. */
public final class NativePty {
    static { System.loadLibrary("termux"); }
    public static native int[] spawnPiped(String command,String cwd,String[] argv,String[] environment) throws java.io.IOException;
}
