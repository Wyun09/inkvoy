# PTY implementation

`app/src/main/cpp/termux.c` is a source snapshot of the Termux terminal-emulator PTY JNI implementation fetched from https://raw.githubusercontent.com/termux/termux-app/master/terminal-emulator/src/main/jni/termux.c on 2026-10-17. Upstream snapshot SHA-256: `a60a2654ee85de607748135997ebd50ec00c52343ba06612dc7487e93cb239da`.

The terminal-emulator component is covered by the Apache-2.0 exception documented by the upstream repository LICENSE.md. The original implementation derives from the Android terminal emulator project; its contributors retain their copyright. A copy of Apache-2.0 is included here. Studio uses the original JNI method signatures; its Java wrapper is made public. The native library is rebuilt using Android NDK r28c with a 16 KiB maximum page alignment, rather than reusing the 4 KiB-aligned v0.118.3 APK binary.

Run `scripts/build-native.ps1 -NdkDirectory <NDK path>` to reproduce the library. The source snapshot is supplied directly so building does not depend on a moving upstream branch.

Studio's modification to `termux.c`: retry `waitpid` after `EINTR` and return an explicit error if waiting fails, instead of reading an uninitialized exit status. `studio.c` is the separate Studio pipe-command extension. It exposes the child PID and separate stdout/stderr descriptors so cancellation can use PRoot's supported SIGQUIT cleanup path without Android hidden APIs.
