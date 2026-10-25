#!/bin/bash
set -euo pipefail
cd /tmp/studio-native-tests
# Populate this isolated directory with the two C sources, JNI.java,
# NativePty.java, test/NativeExecutionSelfTest.java and the pinned PRoot source.
# Install libtalloc-dev on the builder. Only the 64-bit loader is needed here.
make -C proot-5.1.107.96/src -j4 HAS_LOADER_32BIT= STRIP=true CFLAGS='-Wall -Wextra -O2 -fgnu89-inline' proot
JAVA_HOME=$(dirname "$(dirname "$(readlink -f /usr/bin/javac)")")
cc -D_GNU_SOURCE -shared -fPIC -O2 -I"$JAVA_HOME/include" -I"$JAVA_HOME/include/linux" termux.c studio.c -o libtermux.so
javac -encoding UTF-8 -d classes JNI.java NativePty.java NativeExecutionSelfTest.java
PROOT=$PWD/proot-5.1.107.96/src/proot
test -x "$PROOT"
java --add-opens java.base/java.io=ALL-UNNAMED -Djava.library.path="$PWD" -cp classes NativeExecutionSelfTest "$PROOT"
