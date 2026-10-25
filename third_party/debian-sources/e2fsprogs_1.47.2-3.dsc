-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: e2fsprogs
Binary: fuse2fs, fuseext2, logsave, e2fsck-static, e2fsprogs-l10n, libcom-err2, comerr-dev, libss2, ss-dev, e2fsprogs-udeb, libext2fs2t64, libext2fs-dev, e2fsprogs
Architecture: any all
Version: 1.47.2-3
Maintainer: Theodore Y. Ts'o <tytso@mit.edu>
Homepage: http://e2fsprogs.sourceforge.net
Standards-Version: 4.7.0
Vcs-Browser: https://git.kernel.org/pub/scm/fs/ext2/e2fsprogs.git
Vcs-Git: https://git.kernel.org/pub/scm/fs/ext2/e2fsprogs.git -b debian/master
Testsuite: autopkgtest
Testsuite-Triggers: fuse3
Build-Depends: dpkg-dev (>= 1.22.5), gettext, texinfo, pkgconf, libarchive-dev <!nocheck>, libfuse3-dev [linux-any kfreebsd-any] <!pkg.e2fsprogs.no-fuse2fs>, debhelper-compat (= 12), dh-exec, libblkid-dev, uuid-dev, m4, udev [linux-any], systemd [linux-any], systemd-dev [linux-any], cron [linux-any], dh-sequence-movetousr
Package-List:
 comerr-dev deb libdevel optional arch=any
 e2fsck-static deb admin optional arch=any profile=!pkg.e2fsprogs.no-static
 e2fsprogs deb admin important arch=any
 e2fsprogs-l10n deb localization optional arch=all
 e2fsprogs-udeb udeb debian-installer optional arch=any profile=!noudeb
 fuse2fs deb admin optional arch=linux-any,kfreebsd-any profile=!pkg.e2fsprogs.no-fuse2fs
 fuseext2 deb oldlibs optional arch=all profile=!pkg.e2fsprogs.no-fuse2fs
 libcom-err2 deb libs optional arch=any
 libext2fs-dev deb libdevel optional arch=any
 libext2fs2t64 deb libs optional arch=any
 libss2 deb libs optional arch=any
 logsave deb admin optional arch=any
 ss-dev deb libdevel optional arch=any
Checksums-Sha1:
 2197a81512f3d463f450a57832798006ca920b8e 9996725 e2fsprogs_1.47.2.orig.tar.gz
 735a4878a0e81c275808fe373a7ec67c8b7b5d99 488 e2fsprogs_1.47.2.orig.tar.gz.asc
 34d330605a1b0863f8b67d1cc4abcdbf626cf735 103684 e2fsprogs_1.47.2-3.debian.tar.xz
Checksums-Sha256:
 6dcd67ff9d8b13274ba3f088e4318be4f5b71412cd863524423fc49d39a6371f 9996725 e2fsprogs_1.47.2.orig.tar.gz
 2063f62a198dd3df21f789c990c2cf9b4a5de24ed55f0b78d86e97e98daffc9d 488 e2fsprogs_1.47.2.orig.tar.gz.asc
 5517aae5ce5196e49fa314492f0639ad7a1692c9521d703b6c81acff77a1564e 103684 e2fsprogs_1.47.2-3.debian.tar.xz
Files:
 752e5a3ce19aea060d8a203f2fae9baa 9996725 e2fsprogs_1.47.2.orig.tar.gz
 29fd2ebec43fedc5c4f3729af5788c79 488 e2fsprogs_1.47.2.orig.tar.gz.asc
 f00b6828cbcb989a8c00a4fd30d9d011 103684 e2fsprogs_1.47.2-3.debian.tar.xz
Dgit: cbf9a5b817d194cd0776d030bdf7c1fca5a0e547 debian archive/debian/1.47.2-3 https://git.dgit.debian.org/e2fsprogs

-----BEGIN PGP SIGNATURE-----

iQEzBAEBCgAdFiEEK2m5VNv+CHkogTfJ8vlZVpUNgaMFAmhKHsMACgkQ8vlZVpUN
gaNY9Af/ZtVI55pfVX4GAXtlbyLYUpqvZZFvKLOdjEhdKx8bzrfb5mQRpRpaytED
nvl6pfcZmdMVdRVWC1+rIUQv8KvVK8+tdOCLIuifEYLqQ/0/8rI/4hR6DKPUhxJQ
zpW1hYnuo0jUlPFWXoe/xv1buuHN5x6MZYfFtARJTUNilucPi1VmtrQRm6gvOFRo
qQZZmB9MG8dP/gpOxifxjNsqAaN45Z8nHWVSSD5E5RrWU2zqxJMIrU4n4BfFBVxd
LDiZKFJHeoXir/oMnr6zyb94vbTxJsV7SY9LygZgbX7lqCbqE4pPU5P1OwgSmrO8
uHN5FU+DSgaxKPrN3xKS6P5ATqy0jg==
=mAES
-----END PGP SIGNATURE-----
