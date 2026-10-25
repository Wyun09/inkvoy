-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: libzip
Binary: libzip-dev, libzip5, zipcmp, zipmerge, ziptool
Architecture: any
Version: 1.11.3-2
Maintainer: Debian Libzip Maintainers <libzip@tracker.debian.org>
Uploaders: Ondřej Surý <ondrej@debian.org>, Florian Ernst <florian@debian.org>
Homepage: https://libzip.org
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/libzip
Vcs-Git: https://salsa.debian.org/debian/libzip.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@
Build-Depends: cmake, debhelper-compat (= 13), dpkg-dev (>= 1.22.5), libbz2-dev, liblzma-dev, libssl-dev, libzstd-dev, mandoc, unzip, zlib1g-dev
Package-List:
 libzip-dev deb libdevel optional arch=any
 libzip5 deb libs optional arch=any
 zipcmp deb utils optional arch=any
 zipmerge deb utils optional arch=any
 ziptool deb utils optional arch=any
Checksums-Sha1:
 fb170cbd72cc79e006cd5db0eeae405fee881571 788520 libzip_1.11.3.orig.tar.xz
 0e8acf9166e5fab51b2c3f6e95636a95a546424c 7872 libzip_1.11.3-2.debian.tar.xz
Checksums-Sha256:
 9509d878ba788271c8b5abca9cfde1720f075335686237b7e9a9e7210fe67c1b 788520 libzip_1.11.3.orig.tar.xz
 126c48cc69b2d7e10400202b42ba0807c477f63350d8a0b6fd5a10cabe8dd037 7872 libzip_1.11.3-2.debian.tar.xz
Files:
 ef2fc3298319e7b93559016257d5e6bd 788520 libzip_1.11.3.orig.tar.xz
 15781c72e40d9725df2d25f48328a317 7872 libzip_1.11.3-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEBn03XtJwVyplJ26xBjdBuvXdHs4FAmesqq0ACgkQBjdBuvXd
Hs4N4g//Ye9VSQ99Jp/ciIjBYrRVEQ90SxyWqfBJiJnlQ3a7gt4BolWo/YNCiGt3
REc5kFtps7q3Ad3VhTGOWhjz0sSUWIFCBoB/MMPIjvjkGVqAHW3LlpNA3K3qdK6y
uMXTH2ArqupR91vf2LFwbTjAvL9DBK3sb20k1GtdweC8kTPsyUaBqaQK4PhkXN0p
Wg1+O4cRRJmdx2YGTAPjVWpbJ9VFgEVOgQfzhBWO64AiwHPIzz2JXXCSDUWMVM5L
ylObcjmyXlAdal2EdFuQUDm8sEQKI//jx+CgoMszNI3zaX8hQu/hgYiFplKg0Cuf
UxCHqPYMwEdMHETEiAPqNKzaxP+qc1WBgB1YnbQoIxzHLwZ30ASNDILnu48S4UTs
8w9dlAMEEyrLWkgBwc/ZNNPyjapbf/uWIoWIXavw0MLtnPMw5vFFF/0liRP9O33N
xbon5JTIDtpKrVXgZ7+9KEq4A6pshawI/uhmCXUFQqFkDFJ+YxWeG//RPNY0L1bZ
FqCo3+LGHAEUuQSW30tbKtS4uU61TqGlmRTHpZp9DCHl+z2RYtpg46q/rjh2+5eM
g1SoFAAfXL+k8oiJhTBsR9HhUVeExvUc6l6qr0Jod6iGZWwsrpJsbUUHT7zEWAgL
dsTngQgBAiAI5FZCWh3YoBu2cBC2jRe8JlZ5oGXIkFeI56FTr0Q=
=NrXi
-----END PGP SIGNATURE-----
