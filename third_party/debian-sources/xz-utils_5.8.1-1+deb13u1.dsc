-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: xz-utils
Binary: liblzma5, liblzma5-udeb, xz-utils, xzdec, liblzma-dev, liblzma-doc
Architecture: any all
Version: 5.8.1-1+deb13u1
Maintainer: Sebastian Andrzej Siewior <sebastian@breakpoint.cc>
Uploaders: Jonathan Nieder <jrnieder@gmail.com>
Homepage: https://tukaani.org/xz/
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/debian/xz-utils
Vcs-Git: https://salsa.debian.org/debian/xz-utils.git
Testsuite: autopkgtest
Testsuite-Triggers: autoconf, automake, debhelper-compat, gettext, libtool
Build-Depends: debhelper-compat (= 13), dpkg-dev (>= 1.16.2), autoconf (>= 2.64~), automake, libtool (>= 2.2), gettext, autopoint | gettext (<< 0.18-1), autopoint | cvs, po4a
Build-Depends-Indep: doxygen, graphviz
Build-Conflicts: automake1.4
Package-List:
 liblzma-dev deb libdevel optional arch=any
 liblzma-doc deb doc optional arch=all
 liblzma5 deb libs optional arch=any
 liblzma5-udeb udeb debian-installer optional arch=any
 xz-utils deb utils standard arch=any
 xzdec deb utils optional arch=any
Checksums-Sha1:
 c29df8058b6279bfab2744f3e79b2940229207a3 1461872 xz-utils_5.8.1.orig.tar.xz
 3658f92b0eec052a58ca69fa3c12c5b095a05fc6 833 xz-utils_5.8.1.orig.tar.xz.asc
 a4388b86149165bb1ae1010d54cf89f2fddfbfcc 25696 xz-utils_5.8.1-1+deb13u1.debian.tar.xz
Checksums-Sha256:
 0b54f79df85912504de0b14aec7971e3f964491af1812d83447005807513cd9e 1461872 xz-utils_5.8.1.orig.tar.xz
 4138f4ceca1aa7fd2085fb15a23f6d495d27bca6d3c49c429a8520ea622c27ae 833 xz-utils_5.8.1.orig.tar.xz.asc
 0e48427971a9ce674ddbba26e34ac1dd009c683f3816ce17852d99dc7b0a8e46 25696 xz-utils_5.8.1-1+deb13u1.debian.tar.xz
Files:
 cf5e1feb023d22c6bdaa30e84ef3abe3 1461872 xz-utils_5.8.1.orig.tar.xz
 7a1c93af83d35ba1e0ba9cbe12f01493 833 xz-utils_5.8.1.orig.tar.xz.asc
 55542a3c8ee3a20b0a82b484c04259fc 25696 xz-utils_5.8.1-1+deb13u1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEOvp1f6xuoR0v9F3wiNJCh6LYmLEFAmpGN5kACgkQiNJCh6LY
mLHzMxAAqk0GgGUxp2zlcUN0eBtJCrytCq8HWLaTMJJ6sadYyL44GgVXxOEF5lEf
3w0c8yLBm7q7tKkwOMQF8EVwORax3VgYtqj4NXJiSQjCBragfestXtMEAPrHtALf
JJHeVT2uz0gKKz7bmIQtuqLuEuQBmDS+/RXFBu4mcaInFOb/SjJX3oihPVQU3qNN
k9tCbPGgCmaUZ1sPaooAXIk1YT7/XgTIWyHFSEyq2n7bpyrVQjlbl3rS4CNusKBA
FGxMzuzAZmJrznlC3t4lSaRRCYwKRw/u0+fdPwX6QBz9ccJE9k7h20koaxQSZaIt
U5hF8iiZx24g3hrt56QjH13IVF2nHC5izkXt7wz8Vkh2s/fdcw3SMoYLXfYnQqlj
b/hBcoNOChhp86+cMgzyQJvcp08ZAfmumidRQD3tlbCp3apFr4e0PZsmq84bVo4r
MYCmcCxqAI9iLGc8SvZrw9vKA1n+QfBpaoiaI7bARVRzrIwnTkgf2LYMci+uJAcI
N9jUw+MR6rtaAdg0cYSFl0qPWym0SbES2I9eMNtCM6K1sAYHxkSwYYM022li+5RL
o4vPGZN6n8o4htyTX75sdya0O0gCrOIJJ5Ly6a6RyYf3QwgVIJ3ZOH6bmowS8zSl
2VFRIMe6kyXR1cMV2tMTLJrcyXBxKLmfneVDWiqiA5CKP7H4SGo=
=zr7B
-----END PGP SIGNATURE-----
