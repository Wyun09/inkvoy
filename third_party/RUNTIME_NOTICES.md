# Debian and native execution components

The offline image is a Debian 13 (trixie) ARM64 userland built from Debian's
signed package repositories. It shares the Android kernel through PRoot.
Installed binary and source package versions are recorded in `packages.tsv` and
in the image at `/opt/studio/provenance/packages.tsv`. Per-package copyright and
license texts remain in `/usr/share/doc/*/copyright` and
`/usr/share/common-licenses`. A matching collection of Debian source archives,
including `.dsc`, upstream files and Debian patches, accompanies the source
release in `third_party/debian-sources/`; its manifest records SHA-256 values.
The image contains no user chat, phone credentials, builder SSH identity or
analysis target other than the tiny self-test fixtures built from this source.

Android launchers are Termux PRoot 5.1.107.96 (GPL-2.0-or-later), talloc 2.5.0
(GPL-3.0), and libandroid-shmem 0.7 (BSD-3-Clause). Exact package URLs, input and
output hashes, and the talloc SONAME change are in `native-launchers.json`.
`scripts/runtime/prepare-native.py` reproduces extraction and the equal-size
`libtalloc.so.2` to `libtalloc.so` string change. No launcher machine code was
modified. Corresponding sources are in `sources/` and the pinned Termux build
recipes and scripts are in `termux-build/`. ARM32 launchers are not shipped.
The native ELF load segments are aligned for 16 KiB page sizes.

The PTY JNI source is derived from the Apache-2.0 Termux terminal-emulator
component. See `termux-pty/README.md` and `termux-pty/LICENSE.txt`, including its
snapshot hash and the Studio `waitpid` change. The independent Studio pipe
extension also resets the inherited signal mask so PRoot can receive SIGQUIT.
`scripts/build-native.ps1` rebuilds these two supplied C sources using NDK r28c.

The Debian image additionally contains JADX 1.5.6 (Apache-2.0), Apktool 3.0.3
(Apache-2.0), CFR 0.152 (MIT), radare2 6.2.4 (LGPL-3.0), and r2ghidra 6.2.4
(LGPL-3.0/GPL-3.0 and bundled Ghidra components under their own licenses).
Pinned binary URLs and SHA-256 values are in `scripts/runtime/artifacts.json`.
The source archives for radare2 and r2ghidra are in `sources/` together with
their origin URLs and hashes. The original library/JAR metadata is retained.
License files extracted from the native source archives are in `licenses/`.
No external proprietary decompiler or Ghidra desktop installation is bundled.

Build scripts download dependencies only on the build machine. Required
runtime tools are present inside the signed APK; the Android app's first
initialization verifies and extracts the image without downloading packages.
Project-specific new dependencies are separate from these preinstalled tools.
