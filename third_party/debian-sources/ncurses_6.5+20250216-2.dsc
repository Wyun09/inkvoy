-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: ncurses
Binary: ncurses-base, ncurses-term, libtinfo6, libtinfo6-udeb, libncurses6, libncurses-dev, libncursesw6, libncursesw6-udeb, lib64tinfo6, lib64ncurses6, lib64ncursesw6, lib64ncurses-dev, lib32tinfo6, lib32ncurses6, lib32ncursesw6, lib32ncurses-dev, ncurses-bin, ncurses-examples, ncurses-doc
Architecture: any all
Version: 6.5+20250216-2
Maintainer: Ncurses Maintainers <ncurses@packages.debian.org>
Uploaders: Sven Joachim <svenjoac@gmx.de>, Craig Small <csmall@debian.org>
Homepage: https://invisible-island.net/ncurses/
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/debian/ncurses
Vcs-Git: https://salsa.debian.org/debian/ncurses.git
Testsuite: autopkgtest
Build-Depends: debhelper-compat (= 13), libgpm-dev [linux-any], pkgconf, autoconf-dickey (>= 2.52+20210509)
Build-Depends-Arch: g++-multilib [amd64 i386 powerpc ppc64 s390 sparc] <!nobiarch>
Build-Depends-Indep: ncurses-term <pkg.ncurses.terminfocheck>
Package-List:
 lib32ncurses-dev deb libdevel optional arch=amd64,ppc64 profile=!nobiarch
 lib32ncurses6 deb libs optional arch=amd64,ppc64 profile=!nobiarch
 lib32ncursesw6 deb libs optional arch=amd64,ppc64 profile=!nobiarch
 lib32tinfo6 deb libs optional arch=amd64,ppc64 profile=!nobiarch
 lib64ncurses-dev deb libdevel optional arch=i386,powerpc,sparc,s390 profile=!nobiarch
 lib64ncurses6 deb libs optional arch=i386,powerpc,sparc,s390 profile=!nobiarch
 lib64ncursesw6 deb libs optional arch=i386,powerpc,sparc,s390 profile=!nobiarch
 lib64tinfo6 deb libs optional arch=i386,powerpc,sparc,s390 profile=!nobiarch
 libncurses-dev deb libdevel optional arch=any
 libncurses6 deb libs optional arch=any
 libncursesw6 deb libs optional arch=any
 libncursesw6-udeb udeb debian-installer optional arch=any profile=!noudeb
 libtinfo6 deb libs optional arch=any
 libtinfo6-udeb udeb debian-installer optional arch=any profile=!noudeb
 ncurses-base deb misc required arch=all essential=yes
 ncurses-bin deb utils required arch=any essential=yes
 ncurses-doc deb doc optional arch=all
 ncurses-examples deb misc optional arch=any profile=!pkg.ncurses.noexamples
 ncurses-term deb misc standard arch=all
Checksums-Sha1:
 e9a1792b02cd603c5a094dadc5046d5440723c4b 3774714 ncurses_6.5+20250216.orig.tar.gz
 df154cc6de3378e3705f4db1ce663d38a9c765d9 729 ncurses_6.5+20250216.orig.tar.gz.asc
 025a3164026bef20a1872b0cc9107236d5738a4a 50420 ncurses_6.5+20250216-2.debian.tar.xz
Checksums-Sha256:
 b37baafa436e7133bb12a185cb8f60e1599b1947e9f0181c76f3190acf28b6eb 3774714 ncurses_6.5+20250216.orig.tar.gz
 64f4d17923322176c44079f18f170e2164a59d551d7e4e9c1a6e4eebedc5dd6f 729 ncurses_6.5+20250216.orig.tar.gz.asc
 546930a8992ae3325d8c38378f290265d969cf6333cfae9648ac6d69e1e8a8a6 50420 ncurses_6.5+20250216-2.debian.tar.xz
Files:
 0d7dd4423cb59dcf62e685f5472bc8e1 3774714 ncurses_6.5+20250216.orig.tar.gz
 c41629327e1cf539a96af2ff3a0c1de5 729 ncurses_6.5+20250216.orig.tar.gz.asc
 3076c3d9895fa8ee4ea91c0af8079664 50420 ncurses_6.5+20250216-2.debian.tar.xz


-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEKF8heKgv5Jai5p4QOxBucY1rMawFAmfJx00ACgkQOxBucY1r
Maz4iw//YKscTVldF2nF75IgQFKBKTILW5Fequ62zoWg8iprIhOpY2n+0YeeawoO
XoSgc0QmNPk20gp27tQ2U2w/vJ9R/tLrBogM9OB/OQy3zcxPtuGmkynHKhlCiYjl
0urXFwvUdkFLkJDUlt8n+u+Dow3Mw2007CHgzEBnQHLK0fpBus/lGNRzXR2fTUsf
BC40xWAJXKLqJpwV+LT3zRZrZ5TJa2JaNryiy/DzkziDI6/qjpySuZQfIgQaQVh+
mWrBM4b+IXVkUFy8XLC8M9Z1YVkfeRg+Vkc+GgeNmdpeU20cRBs+u+Ow3km0KGeM
MlcBG/fZfdCopQbrXbmiGnicEmZExxXcGXDpekJG68sa+vRD/QfO0PVcfcL9MDnk
sMmuZ+cr/hFFJoaFA95Ox3Lg8FcSBgG8Zy3t5cJOVhyIAlepnB7aGhD246y7rWYK
KEVnCaQYuT6BHxduH2c1PUD3UaJQMDx8Uev+MLNiEQQNT6RQWaOc7x8AI2GVt0vM
JysAMWXSoWuD+lLCqWyrGjqIKjXXlGchinzOo8iTe0KioLQw99GX/q8nqywQHQMI
kGxhWnwkI5JoNTLHck3t3ZRecLkqGtBjoRwISTr3U8PrsS7T9bgUxbQtHhXOqj7C
kf4nt3uU+S/NEvytfytc7aIjwnlZ1VVMxjzWWaJSUPQH5nu1uSU=
=dWRk
-----END PGP SIGNATURE-----
