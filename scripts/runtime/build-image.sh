#!/bin/bash
# Run on a dedicated Debian ARM64 builder with sudo. Never on the phone.
set -euo pipefail
HERE=$(cd -- "$(dirname -- "$0")" && pwd)
export STUDIO_BUILD_ROOT=${STUDIO_BUILD_ROOT:-/opt/studio-rootfs}
export STUDIO_ASSETS_DIR=${STUDIO_ASSETS_DIR:-$HOME/studio-build-input}
ROOT=$STUDIO_BUILD_ROOT
case "$ROOT" in /opt/studio-rootfs|/opt/studio-rootfs-*) ;; *) echo 'Use a dedicated /opt/studio-rootfs directory';exit 1;; esac
[ "$(dpkg --print-architecture)" = arm64 ] || { echo 'Use a native ARM64 Debian builder (QEMU system ARM64 is supported).';exit 1; }
sudo apt-get update
sudo apt-get install -y --no-install-recommends debootstrap python3 unzip ca-certificates pigz
python3 "$HERE/download-artifacts.py" "$STUDIO_ASSETS_DIR"
for f in sample.apk sample.jar sample.dex; do [ -f "$STUDIO_ASSETS_DIR/$f" ] || { echo "Generate the tiny self-test fixtures with scripts/make-runtime-fixtures.ps1: $f";exit 1; };done
cp "$HERE/self-test.sh" "$STUDIO_ASSETS_DIR/self-test.sh"
[ -f "$ROOT/etc/debian_version" ] || sudo debootstrap --arch=arm64 --variant=minbase trixie "$ROOT" https://deb.debian.org/debian
sudo mkdir -p "$ROOT/"{proc,sys,dev,workspace,tmp,opt/studio}
for d in dev proc sys; do mountpoint -q "$ROOT/$d" || sudo mount --rbind "/$d" "$ROOT/$d";sudo mount --make-rslave "$ROOT/$d";done
sudo cp /etc/resolv.conf "$ROOT/etc/resolv.conf"
printf '#!/bin/sh\nexit 101\n' | sudo tee "$ROOT/usr/sbin/policy-rc.d" >/dev/null
sudo chmod 755 "$ROOT/usr/sbin/policy-rc.d"
sudo chroot "$ROOT" /bin/bash -eux <<'GUEST'
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends bash coreutils findutils grep sed gawk less nano procps psmisc python3 python3-pip python3-venv nodejs npm git openjdk-21-jdk-headless curl wget ca-certificates zip unzip xz-utils bzip2 gzip tar file binutils xxd build-essential pkg-config libsmali-java libzip5 liblz4-1 libzstd1 libssl3t64
chmod 1777 /tmp
GUEST
bash "$HERE/install-tools.sh"
sudo chroot "$ROOT" /bin/bash -lc /opt/studio/selftest/run.sh | tee "$STUDIO_ASSETS_DIR/tool-selftest.log"
echo 'Build complete. Use finalize-image.sh after recording any native execution tests.'
