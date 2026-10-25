#!/bin/bash
# Deletes only build caches/temp files in the dedicated image; never project data.
set -euo pipefail
ROOT=${STUDIO_BUILD_ROOT:-/opt/studio-rootfs}
OUT=${STUDIO_IMAGE_OUTPUT:-/home/studio/runtime-release}
case "$ROOT" in /opt/studio-rootfs|/opt/studio-rootfs-*) ;; *) echo 'Unsafe build root';exit 1;; esac
[ "$(realpath "$ROOT")" = "$ROOT" ] && [ -f "$ROOT/etc/debian_version" ] || exit 1
mkdir -p "$OUT"
# Preserve exact installed binary/source versions, including dependencies.
sudo chroot "$ROOT" dpkg-query -W -f='${binary:Package}\t${Version}\t${Architecture}\t${source:Package}\t${source:Version}\n' > "$OUT/packages.tsv"
sudo mkdir -p "$ROOT/opt/studio/provenance"
sudo cp "$OUT/packages.tsv" "$ROOT/opt/studio/provenance/packages.tsv"
sudo chroot "$ROOT" apt-get clean
for d in tmp var/tmp var/lib/apt/lists var/cache/apt/archives var/log workspace;do
  [ -d "$ROOT/$d" ] && sudo find "$ROOT/$d" -xdev -mindepth 1 -delete
done
sudo rm -f "$ROOT/root/.bash_history" "$ROOT/root/.lesshst" "$ROOT/etc/machine-id" "$ROOT/var/lib/dbus/machine-id"
printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' | sudo tee "$ROOT/etc/resolv.conf" >/dev/null
printf 'deepseek-studio\n' | sudo tee "$ROOT/etc/hostname" >/dev/null
printf '127.0.0.1 localhost deepseek-studio\n::1 localhost\n' | sudo tee "$ROOT/etc/hosts" >/dev/null
sudo chmod 1777 "$ROOT/tmp" "$ROOT/var/tmp"
# Remove the build-only mount views before archiving. Exclude them explicitly too.
for d in dev sys proc; do
  if mountpoint -q "$ROOT/$d";then
    sudo mount --make-rprivate "$ROOT/$d"
    sudo umount -R "$ROOT/$d" || sudo umount -l "$ROOT/$d"
  fi
done
sudo find "$ROOT/dev" -mindepth 1 -delete
sudo mkdir -p "$ROOT/dev/pts" "$ROOT/proc" "$ROOT/sys" "$ROOT/workspace" "$ROOT/system" "$ROOT/apex"
sudo python3 - "$ROOT" "$OUT/image-stats.json" <<'PY'
import json, os, stat, sys
root, output = sys.argv[1:]; count=1; payload=0; allocated=0; seen=set()
for directory, dirs, files in os.walk(root, followlinks=False):
    for name in dirs+files:
        s=os.lstat(os.path.join(directory,name));count+=1;allocated+=s.st_blocks*512
        key=(s.st_dev,s.st_ino)
        if stat.S_ISREG(s.st_mode) and key not in seen: payload+=s.st_size;seen.add(key)
json.dump(dict(files=count,unpackedBytes=payload,allocatedBytes=allocated,requiredFreeBytes=allocated+count*4096+268435456),open(output,'w'),indent=2)
PY
# GNU format supports long names without timestamps from PAX. Numeric owners are guest root.
compress=(gzip -1n)
command -v pigz >/dev/null && compress=(pigz -1n -p 4)
sudo tar --format=gnu --one-file-system --numeric-owner --owner=0 --group=0 --sort=name --mtime='2026-10-18 00:00:00Z' -C "$ROOT" -cf - . | "${compress[@]}" > "$OUT/debian-arm64.tar.gz.partial"
mv "$OUT/debian-arm64.tar.gz.partial" "$OUT/debian-arm64.tar.gz"
sha256sum "$OUT/debian-arm64.tar.gz" > "$OUT/SHA256SUMS"
echo 'OFFLINE_IMAGE_READY'
