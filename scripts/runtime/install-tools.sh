#!/bin/bash
set -euo pipefail
ROOT=${STUDIO_BUILD_ROOT:-/opt/studio-rootfs}
ASSETS=${STUDIO_ASSETS_DIR:-/home/studio}
case "$ROOT" in /opt/studio-rootfs|/opt/studio-rootfs-*) ;; *) echo 'Use a dedicated /opt/studio-rootfs build directory';exit 1;; esac
[ -f "$ROOT/etc/debian_version" ] || { echo 'Build Debian first';exit 1; }
sudo mkdir -p "$ROOT/opt/studio/jadx" "$ROOT/opt/studio/java" "$ROOT/opt/studio/r2ghidra" "$ROOT/opt/studio/selftest" "$ROOT/usr/local/bin" "$ROOT/root/.local/share/radare2/plugins"
sudo unzip -q -o "$ASSETS/jadx.zip" -d "$ROOT/opt/studio/jadx"
sudo unzip -q -o "$ASSETS/r2ghidra-arm64.zip" -d "$ROOT/opt/studio/r2ghidra"
sudo cp "$ASSETS/apktool.jar" "$ROOT/opt/studio/java/apktool.jar"
sudo cp "$ASSETS/cfr.jar" "$ROOT/opt/studio/java/cfr.jar"
sudo cp "$ASSETS/radare2-arm64.deb" "$ROOT/tmp/radare2.deb"
sudo chroot "$ROOT" dpkg -i /tmp/radare2.deb
sudo cp "$ROOT/opt/studio/r2ghidra/plugins/core_ghidra.so" "$ROOT/root/.local/share/radare2/plugins/"
sudo cp -a "$ROOT/opt/studio/r2ghidra/plugins/r2ghidra_sleigh" "$ROOT/root/.local/share/radare2/plugins/"
for tool in apktool cfr;do
 sudo tee "$ROOT/usr/local/bin/$tool" >/dev/null <<WRAPPER
#!/bin/sh
exec java -Xms32m -Xmx512m -XX:ActiveProcessorCount=2 -XX:+UseSerialGC -jar /opt/studio/java/$tool.jar "\$@"
WRAPPER
done
sudo tee "$ROOT/usr/local/bin/jadx" >/dev/null <<'WRAPPER'
#!/bin/sh
export JAVA_OPTS="-Xms32m -Xmx512m -XX:ActiveProcessorCount=2 -XX:+UseSerialGC ${JAVA_OPTS:-}"
exec /opt/studio/jadx/bin/jadx -j 2 "$@"
WRAPPER
sudo chmod 755 "$ROOT/usr/local/bin/"{jadx,apktool,cfr} "$ROOT/opt/studio/jadx/bin/jadx"
sudo cp "$ASSETS/"{sample.apk,sample.jar,sample.dex} "$ROOT/opt/studio/selftest/"
sudo cp "$ASSETS/self-test.sh" "$ROOT/opt/studio/selftest/run.sh"
sudo chmod 755 "$ROOT/opt/studio/selftest/run.sh"
sudo tee "$ROOT/opt/studio/selftest/sample.c" >/dev/null <<'SOURCE'
#include <stdio.h>
__attribute__((noinline)) int studio_add(int left,int right){return left+right+7;}
int main(void){puts("STUDIO_ELF_FIXTURE");return studio_add(2,3)==12?0:1;}
SOURCE
sudo tee "$ROOT/etc/profile.d/studio.sh" >/dev/null <<'PROFILE'
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export LANG=C.UTF-8 TERM=xterm-256color COLORTERM=truecolor
export SLEIGHHOME=/opt/studio/r2ghidra/plugins/r2ghidra_sleigh
export JAVA_TOOL_OPTIONS='-Xms32m -Xmx512m -XX:ActiveProcessorCount=2 -XX:+UseSerialGC'
PROFILE
sudo tee "$ROOT/root/.bashrc" >/dev/null <<'PROFILE'
export PS1='\[\e[38;5;150m\]studio\[\e[0m\]:\[\e[38;5;109m\]\w\[\e[0m\] $ '
export HISTFILE=/workspace/.studio/bash_history HISTSIZE=5000 HISTFILESIZE=10000
mkdir -p /workspace/.studio
bind 'set enable-bracketed-paste on' 2>/dev/null || true
PROFILE
sudo tee "$ROOT/root/.bash_profile" >/dev/null <<'PROFILE'
[ -f ~/.bashrc ] && . ~/.bashrc
PROFILE
echo 'TOOLS_INSTALLED'
