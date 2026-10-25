#!/bin/bash
set -u
export LC_ALL=C.UTF-8
HERE=/opt/studio/selftest
OUT=$(mktemp -d /tmp/studio-selftest.XXXXXX) || exit 1
failed=0;passed=0
check(){ local label=$1;shift;printf '\n>>> %s\n' "$label";if "$@";then printf 'PASS %s\n' "$label";passed=$((passed+1));else printf 'FAIL %s\n' "$label";failed=$((failed+1));fi;}
check 'Bash' bash --version
check 'Python' python3 -c 'from pathlib import Path; p=Path("/tmp/studio-python-proof"); p.write_text("PYTHON_OK"); assert p.read_text()=="PYTHON_OK"; p.unlink(); print("PYTHON_OK")'
check 'Node' node -e 'const fs=require("fs");fs.writeFileSync("/tmp/studio-node-proof","NODE_OK");if(fs.readFileSync("/tmp/studio-node-proof","utf8")!=="NODE_OK")process.exit(1);fs.unlinkSync("/tmp/studio-node-proof");console.log("NODE_OK")'
check 'npm' npm --version
check 'Git' git --version
check 'Java' java -version
check 'JADX version' jadx --version
check 'JADX APK to Java' jadx -d "$OUT/jadx" "$HERE/sample.apk"
check 'JADX source verification' grep -R -q STUDIO_JAVA_FIXTURE "$OUT/jadx/sources"
check 'Apktool resources and Smali' apktool d -f -o "$OUT/apktool" "$HERE/sample.apk"
check 'Decoded Android Manifest' grep -q studio.fixture "$OUT/apktool/AndroidManifest.xml"
check 'Baksmali DEX disassembly' baksmali d "$HERE/sample.dex" -o "$OUT/smali"
check 'Smali round trip' smali a "$OUT/smali" -o "$OUT/reassembled.dex"
check 'Reassembled DEX structure' bash -c 'head -c3 "$1" | grep -q dex' _ "$OUT/reassembled.dex"
check 'CFR JAR to Java' cfr "$HERE/sample.jar" --outputdir "$OUT/cfr"
check 'CFR source verification' grep -R -q STUDIO_JAVA_FIXTURE "$OUT/cfr"
check 'C compiler and executable' bash -c 'cc -g -O0 "$1/sample.c" -o "$2/sample.elf" && "$2/sample.elf"' _ "$HERE" "$OUT"
check 'file AArch64 identification' bash -c 'file "$1" | grep -qi aarch64' _ "$OUT/sample.elf"
check 'readelf symbols' bash -c 'readelf -s "$1" | grep -q studio_add' _ "$OUT/sample.elf"
check 'objdump disassembly' bash -c 'objdump -d "$1" | grep -q studio_add' _ "$OUT/sample.elf"
check 'strings inspection' bash -c 'strings "$1" | grep -q STUDIO_ELF_FIXTURE' _ "$OUT/sample.elf"
check 'xxd inspection' bash -c 'xxd -l4 "$1" | grep -q "7f45 4c46"' _ "$OUT/sample.elf"
check 'radare2 version' r2 -v
check 'r2ghidra actual pseudocode' bash -c 'r2 -q -e scr.color=false -A -c "s sym.studio_add;pdg" "$1" >"$2" 2>"$3" && grep -q return "$2" && grep -q 7 "$2"' _ "$OUT/sample.elf" "$OUT/pseudocode.c" "$OUT/r2-stderr.txt"
if [ -f "$OUT/pseudocode.c" ];then cat "$OUT/pseudocode.c";fi
check 'curl' curl --version
check 'ZIP and unzip' bash -c 'cd "$1" && printf ZIP_OK >zip-proof && zip -q proof.zip zip-proof && unzip -p proof.zip zip-proof | grep -q ZIP_OK' _ "$OUT"
printf '\nSTUDIO_SELFTEST passed=%s failed=%s output=%s\n' "$passed" "$failed" "$OUT"
[ "$failed" -eq 0 ]
