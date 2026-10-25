-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: libjpeg-turbo
Binary: libjpeg-dev, libjpeg62-turbo-dev, libjpeg62-turbo, libturbojpeg0, libturbojpeg0-dev, libjpeg-turbo-progs, libturbojpeg-java
Architecture: any all
Version: 1:2.1.5-4
Maintainer: Ondřej Surý <ondrej@debian.org>
Uploaders: Mike Gabriel <sunweaver@debian.org>
Homepage: https://www.libjpeg-turbo.org/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/libjpeg-turbo/
Vcs-Git: https://salsa.debian.org/debian/libjpeg-turbo.git
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, pkg-config
Build-Depends: cmake, debhelper-compat (= 13), default-jdk [!hppa !hurd-any !powerpc], help2man, javahelper, nasm
Package-List:
 libjpeg-dev deb libdevel optional arch=any
 libjpeg-turbo-progs deb graphics optional arch=any
 libjpeg62-turbo deb libs optional arch=any
 libjpeg62-turbo-dev deb libdevel optional arch=any
 libturbojpeg-java deb java optional arch=all
 libturbojpeg0 deb libs optional arch=any
 libturbojpeg0-dev deb libdevel optional arch=any
Checksums-Sha1:
 3731459f8774035efac9bd0a3b890832484a2681 2264471 libjpeg-turbo_2.1.5.orig.tar.gz
 dec74bbb0ec4373046d6fa98608c1825d47856ab 108128 libjpeg-turbo_2.1.5-4.debian.tar.xz
Checksums-Sha256:
 254f3642b04e309fee775123133c6464181addc150499561020312ec61c1bf7c 2264471 libjpeg-turbo_2.1.5.orig.tar.gz
 739e7dc22904dccdc5ab105de57a6e4c1515c0e841e68226e6410ff4976e0e91 108128 libjpeg-turbo_2.1.5-4.debian.tar.xz
Files:
 d09e8d0639bfbaf8e16360d823900599 2264471 libjpeg-turbo_2.1.5.orig.tar.gz
 cce8ec9ae6141b55379414e6cbda4988 108128 libjpeg-turbo_2.1.5-4.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQJJBAEBCAAzFiEEm/uu6GwKpf+/IgeCmvRrMCV3GzEFAmgWJT8VHHN1bndlYXZl
ckBkZWJpYW4ub3JnAAoJEJr0azAldxsxT1MQAIQzJDxz5ZYJyOTVxquyydeSHy+Q
6Nl7vNbbM+4WzxfoR8Gt9yobzbnEtMEJt0NglOSpLhzgGkoFD0bfJEMooqT2pGj3
CbNyx4cMbjmZ0Ac5wX1Ndq6ote/GGR0x9LSO0YrlH8TympFWnKF6GnM/O6tjCi/u
OQt+yxG0z/1PVCHCl+UhBqWC5SwZZxtondHCp5XmPvLqN/ryvhcMX0Yl/z5EsRN0
Nv4X/rUJRhByMNVcCSRxNo/GFhe67XpzC6te688FBYvyrKzGJLmFL8GcrKwKDs3v
iXrsCgv+061zDl4WdjbAo1WX6ZcIMIuza3q3uKb9GXIF/brdLEwqHK3a3eFDV9SR
Lsur6ZHbatAGlDy9Njj4nVlSa0hpHMKBXh7s3ImfQg5+vAJ35MSY1JqzBk9Z24Dx
NLv3h4gZLEf0uUr9Sceh01kw7MjjhjifdcqYHUmb44aHi23njkvqUGdNEtksNXYZ
Fuj5cPtBH8cc/+pckdCB0BrsgejWvVGJEvsHVOp7pWGNIitKMJRAYhGfp/7kmLLg
2D02IbEsHN8JeO9Ba8wm8C/jk/PsH+rYyou2tVRAZzWdu4LqJ961xNJiweBYDeCO
mUnjgTsTQjbfBkag1d/spIFZegN/+YISzp7YU04QcpwRytJLrhxoMyLwD6ct0pYN
24SAQFm6N972reRx
=FTal
-----END PGP SIGNATURE-----
