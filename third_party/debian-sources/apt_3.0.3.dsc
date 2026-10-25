-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (native)
Source: apt
Binary: apt, libapt-pkg7.0, apt-doc, libapt-pkg-dev, libapt-pkg-doc, apt-utils, apt-transport-https
Architecture: any all
Version: 3.0.3
Maintainer: APT Development Team <deity@lists.debian.org>
Uploaders: Michael Vogt <mvo@debian.org>, Julian Andres Klode <jak@debian.org>, David Kalnischkies <donkult@debian.org>
Standards-Version: 4.1.1
Vcs-Browser: https://salsa.debian.org/apt-team/apt
Vcs-Git: https://salsa.debian.org/apt-team/apt.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, aptitude, db-util, dpkg, expect, fakeroot, g++, gdb, gpgv, gpgv-sq, jq, libfile-fcntllock-perl, lsof, moreutils, pkg-config, python3-apt, sq, sqv, stunnel4, valgrind-if-available, wget
Build-Depends: dpkg-dev (>= 1.22.5) <!pkg.apt.ci>, cmake (>= 3.4), debhelper-compat (= 12), docbook-xml <!nodoc>, docbook-xsl <!nodoc>, dpkg-dev (>= 1.20.8), gettext (>= 0.12), googletest <!nocheck> | libgtest-dev <!nocheck>, libbz2-dev, libdb-dev, libssl-dev, liblz4-dev (>= 0.0~r126), liblzma-dev, libseccomp-dev (>= 2.4.2) [amd64 arm64 armel armhf i386 mips mips64el mipsel ppc64el s390x hppa powerpc powerpcspe ppc64 x32], libsystemd-dev [linux-any], libudev-dev [linux-any], libxxhash-dev (>= 0.8), libzstd-dev (>= 1.0), ninja-build, pkg-config, po4a (>= 0.34-2) <!nodoc>, sqv (>= 1.3.0) [amd64 arm64 armel armhf i386 mips64el ppc64el riscv64 s390x hurd-amd64 hurd-i386 loong64 powerpc ppc64 sparc64] <!pkg.apt.nosqv> | gpgv, triehash, xsltproc <!nodoc>, zlib1g-dev
Build-Depends-Indep: doxygen <!nodoc !pkg.apt.nodoxygen>, graphviz <!nodoc !pkg.apt.nodoxygen>, w3m <!nodoc>
Package-List:
 apt deb admin required arch=any
 apt-doc deb doc optional arch=all profile=!nodoc
 apt-transport-https deb oldlibs optional arch=all
 apt-utils deb admin required arch=any
 libapt-pkg-dev deb libdevel optional arch=any
 libapt-pkg-doc deb doc optional arch=all profile=!nodoc
 libapt-pkg7.0 deb libs optional arch=any
Checksums-Sha1:
 d5db7bec0f62e2ef71d140c17977e6153bb2d09b 2422096 apt_3.0.3.tar.xz
Checksums-Sha256:
 5b5f6f6d26121742a83aa80d4ed0eb0c6ce9bea259518db412edefd95760e4ef 2422096 apt_3.0.3.tar.xz
Files:
 17a204058fd6219f5d268830e5b77140 2422096 apt_3.0.3.tar.xz

-----BEGIN PGP SIGNATURE-----

iQJDBAEBCgAtFiEET7WIqEwt3nmnTHeHb6RY3R2wP3EFAmha20EPHGpha0BkZWJp
YW4ub3JnAAoJEG+kWN0dsD9x0bUP/3Is3Jg9Z5+snSWEs2wECIfDQ9RhCc/XjltI
YFM84QpE0sbMoSwi9ac2HyY34XgXEiQHSnINJ2Uh46gVTI/l4f24uOALfiuokTRe
Iiq1glg9kGPc53QJFBAGRLkcqUBjAvyJgDtdk5vgzwq7YFBlxhbrgJ7ngJNXOy4Q
jaFRtAQPAEFuGgKzLAwBMd29f8VZ4pJHIvDJ69j3iOzh/KFivyB76l0mGiPXKQNZ
fxaRItdt+HkbrkUBreUHm4cwWD98GMGaAY74V2Wb/3V84px6i8IdwrzikO90G5UF
u0skT1owgYtyxWIz36mqwXydhBuZKN0SkKTiJY4a6rB0gmD6RS/zZtcakA5YyUD7
YMwx3B3vDApG17XEGWC8FJJHZTanCSPdx18Sij2rwz4LS2rUtzfGtJaai4Mv7+YV
V2YXvKgdfpMVsgbXZP4CDRiYOxh+GP/OeiUKgethvzuDLNfA98kGNudo8F3yq/zG
n1b6w4wOxQN+E9dJjatM+kdmBFOLWsdKPc90MZmwpt4Umq4w/PkQCp6uGgd4CHcV
Nq9HEkRIkPic0sDlr1lbsy0qt3C/gv0NZOkW+n9TKZtPQ2XxTbE1HzbMn88+tp9Q
Lo9mD2yp8b9CT7UXZ04lobGZz0H5bazFeloKbwvGNxVknnMkNrnWOVOlUSbohjUO
KUxeBgLc
=MXqi
-----END PGP SIGNATURE-----
