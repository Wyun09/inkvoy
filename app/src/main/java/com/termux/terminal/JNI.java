package com.termux.terminal;

/** Termux terminal-emulator PTY interface, v0.118.3.
 * Upstream: https://github.com/termux/termux-app/tree/v0.118.3/terminal-emulator
 * Apache-2.0 terminal-emulator code; source and notices are included in third_party.
 * The Java visibility is public so the Studio backend can use the original JNI ABI. */
public final class JNI {
    static { System.loadLibrary("termux"); }
    public static native int createSubprocess(String cmd,String cwd,String[] args,String[] envVars,int[] processId,int rows,int columns,int cellWidth,int cellHeight);
    public static native void setPtyWindowSize(int fd,int rows,int cols,int cellWidth,int cellHeight);
    public static native int waitFor(int processId);
    public static native void close(int fd);
}
