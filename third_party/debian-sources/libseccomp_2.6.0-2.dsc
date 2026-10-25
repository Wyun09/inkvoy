-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: libseccomp
Binary: libseccomp-dev, libseccomp2, seccomp, python3-seccomp
Architecture: linux-any
Version: 2.6.0-2
Maintainer: Kees Cook <kees@debian.org>
Uploaders: Luca Bruno <lucab@debian.org>, Felix Geyer <fgeyer@debian.org>
Homepage: https://github.com/seccomp/libseccomp
Standards-Version: 3.9.7
Vcs-Browser: https://salsa.debian.org/debian/libseccomp
Vcs-Git: https://salsa.debian.org/debian/libseccomp.git
Testsuite: autopkgtest
Testsuite-Triggers: build-essential
Build-Depends: debhelper-compat (= 12), linux-libc-dev, dh-python <!nopython>, python3-all-dev:any <!nopython>, libpython3-all-dev <!nopython>, cython3:native <!nopython>, python3-setuptools <!nopython>, gperf
Package-List:
 libseccomp-dev deb libdevel optional arch=linux-any
 libseccomp2 deb libs optional arch=linux-any
 python3-seccomp deb python optional arch=linux-any profile=!nopython
 seccomp deb utils optional arch=linux-any
Checksums-Sha1:
 2eb0222d379756bd5f0a52c0488a20e3311bbf00 685655 libseccomp_2.6.0.orig.tar.gz
 a3a445eac376025b8b55998ac7c9ceb92db9a0d3 833 libseccomp_2.6.0.orig.tar.gz.asc
 2e7b2ad26b39ade9ee22652047d2c2c40a04991b 20800 libseccomp_2.6.0-2.debian.tar.xz
Checksums-Sha256:
 83b6085232d1588c379dc9b9cae47bb37407cf262e6e74993c61ba72d2a784dc 685655 libseccomp_2.6.0.orig.tar.gz
 52e338fa958128293cbd25d2be189e34da41c4f4abbb1b641cf58f373c001f94 833 libseccomp_2.6.0.orig.tar.gz.asc
 ed705ec85719403e77d004c99c0b06b795f090c66fcae265c4bcf37ffea9cc27 20800 libseccomp_2.6.0-2.debian.tar.xz
Files:
 2d42bcde31fd6e994fcf251a1f71d487 685655 libseccomp_2.6.0.orig.tar.gz
 0aec370c605304c08666bdb14501ce35 833 libseccomp_2.6.0.orig.tar.gz.asc
 bf3ec626c58be8f1a7f1c8f1e8a09617 20800 libseccomp_2.6.0-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEFkxwUS95KUdnZKtW/iLG/YMTXUUFAmfchaMACgkQ/iLG/YMT
XUXvJxAAuAhTniKiDqwClzQqFcoHKejGN3QoeWqor6gogRB+XPvFvwPuo2gKkgzo
PE15Of3P9TeW86L4OMNZzpyM1cvCoGB/eXH3hSFSptbXdoTJW11Zn9jUDyG/Y9/a
2fRYLVj1OwHs8xyqWn6JJmP6n/8sAytdbPMwMg7h/cNZ6qyQEiMnT0219MiVM580
LJls8iFX+j73IP2JCN10w1l/qnP4H0ToMOk9lRHZW6SW1WU/6yMtMY14usR9bQV2
JodTFjsg/0r0agf4QFCiPK4tH+RqW0u2T5P/1GSHgEvt5YP3Df7k58HXg9cuT/tf
M5mPnT/0iLjlw2FNkYlOLXgla+sbPqzPaZwOf3oqDmljWTkN1ltGZDfWZ9hjY8ZQ
mumKDDFmIYSwLAHDR72JlDcTyWwvuRs4jsr5MMAL5yzhUO890ppVTNfHB8BYoKi6
eGq1496+rFl4dRVwkhj8jEujAyTyyOk0wFfbZKRZe3jE8oKEJP/prtrlBLnuFyZL
NLaExGOdDSLEkzrIbELrWV9HxyosTJMRis3eLOOZcYpG40X2FFlVaYcDVMydMegP
aD8bvTbRqjfojTWH/aIs+rBFgUxXBOEof5e/fAUUcjP5iISIDrzn4poejY81JCGc
G6+hefOYMBcur5QtWfK3QkVU7GeUKrrwk7vQyOeD0E3TBNSakDA=
=cbj6
-----END PGP SIGNATURE-----
