-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: libxcrypt
Binary: libcrypt1, libcrypt2, libcrypt-dev, libcrypt1-udeb, libxcrypt-source
Architecture: any all
Version: 1:4.4.38-1
Maintainer: Marco d'Itri <md@linux.it>
Standards-Version: 4.7.0.2
Vcs-Browser: https://salsa.debian.org/md/libxcrypt
Vcs-Git: https://salsa.debian.org/md/libxcrypt.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, build-essential, pkg-config
Build-Depends: debhelper-compat (= 13), autoconf, automake, libtool, pkgconf
Package-List:
 libcrypt-dev deb libdevel optional arch=any
 libcrypt1 deb libs optional arch=gnu-any-any
 libcrypt1-udeb udeb debian-installer optional arch=gnu-any-any
 libcrypt2 deb libs optional arch=musl-any-any
 libxcrypt-source deb devel optional arch=all
Checksums-Sha1:
 1ddb65a7d360d026586ee83b35430b0d1da39b34 394216 libxcrypt_4.4.38.orig.tar.xz
 a153f83a63de70924cdd8c04d06f6e3edef57505 8512 libxcrypt_4.4.38-1.debian.tar.xz
Checksums-Sha256:
 6a275a356622c64ba9f693892215dbb399c003a7a4afeed9c4c74070eaab20f4 394216 libxcrypt_4.4.38.orig.tar.xz
 6b87bcb5325e417ab3f4c01c364233444b4c9008a69ec1d6fababb3f6e693a5e 8512 libxcrypt_4.4.38-1.debian.tar.xz
Files:
 c3dc1396e5b9dc6aefa0f3f1d2eecaa1 394216 libxcrypt_4.4.38.orig.tar.xz
 a8f1f37f76acc773976e65badef4296d 8512 libxcrypt_4.4.38-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iHUEARYKAB0WIQQnKUXNg20437dCfobLPsM64d7XgQUCZ4lvkwAKCRDLPsM64d7X
gUdGAQCIrR7+A3gZb/zBBQOLia8Mjw557e6wMEiF0DO/DmV7VAD/Qg3GVsYuSPSg
U/5bjuwY0q994ph3DXbbvdDPz0TLZQs=
=vIO6
-----END PGP SIGNATURE-----
