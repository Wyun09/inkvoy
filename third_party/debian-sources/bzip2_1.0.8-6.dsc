-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: bzip2
Binary: libbz2-1.0, libbz2-dev, bzip2, bzip2-doc
Architecture: any all
Version: 1.0.8-6
Maintainer: Anibal Monsalve Salazar <anibal@debian.org>
Uploaders: Santiago Ruano Rincón <santiago@debian.org>, Anthony Fok <foka@debian.org>
Homepage: https://sourceware.org/bzip2/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/bzip2
Vcs-Git: https://salsa.debian.org/debian/bzip2.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, build-essential
Build-Depends: debhelper-compat (= 13)
Build-Depends-Indep: texinfo, docbook-xml, docbook2x, xsltproc
Package-List:
 bzip2 deb utils standard arch=any
 bzip2-doc deb doc optional arch=all
 libbz2-1.0 deb libs important arch=any
 libbz2-dev deb libdevel optional arch=any
Checksums-Sha1:
 bf7badf7e248e0ecf465d33c2f5aeec774209227 810029 bzip2_1.0.8.orig.tar.gz
 339a767cb2f05ec32402bae7269d98fd14413428 26991 bzip2_1.0.8-6.debian.tar.bz2
Checksums-Sha256:
 ab5a03176ee106d3f0fa90e381da478ddae405918153cca248e682cd0c4a2269 810029 bzip2_1.0.8.orig.tar.gz
 648ed0dac9a041ba6951e0cca521628aa39947cefee78139f7b934a5dc502095 26991 bzip2_1.0.8-6.debian.tar.bz2
Files:
 67e051268d0c475ea773822f7500d0e5 810029 bzip2_1.0.8.orig.tar.gz
 54b72833f3645b4c3341481e5cd82ca9 26991 bzip2_1.0.8-6.debian.tar.bz2

-----BEGIN PGP SIGNATURE-----

iIoEARYIADIWIQR+lHTq7mkJOyB6t2Un3j1FEEiG7wUCZsN0bBQcc2FudGlhZ29A
ZGViaWFuLm9yZwAKCRAn3j1FEEiG78ejAP0aFJMP2WquvG0ixMBpADPXl1qzAGh6
FQ0cvFvi3QmHnwEA+Wgh9jbBxtPeEqTh6P1Gei0iGJeDeFkzTQIi5usZEAY=
=Cvhe
-----END PGP SIGNATURE-----
