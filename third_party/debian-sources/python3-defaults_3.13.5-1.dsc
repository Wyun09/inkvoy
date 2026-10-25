-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 1.0
Source: python3-defaults
Binary: python3, python3-venv, python3-minimal, python3-nopie, python3-examples, python3-dev, libpython3-dev, libpython3-stdlib, idle, python3-doc, python3-dbg, libpython3-dbg, python3-all, python3-all-dev, python3-all-dbg, python3-all-venv, libpython3-all-dev, libpython3-all-dbg, python3-full
Architecture: any all
Version: 3.13.5-1
Maintainer: Matthias Klose <doko@debian.org>
Uploaders: Piotr Ożarowski <piotr@debian.org>, Stefano Rivera <stefanor@debian.org>
Homepage: https://www.python.org/
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/cpython-team/python3-defaults
Vcs-Git: https://salsa.debian.org/cpython-team/python3-defaults.git
Build-Depends: debhelper (>= 11), dpkg-dev (>= 1.17.11), python3.13:any (>= 3.13.5-1~), python3.13-minimal:any, python3-docutils <!nodoc>, python3-sphinx <!nodoc>, html2text (>= 2) <!nodoc>
Package-List:
 idle deb python optional arch=all
 libpython3-all-dbg deb debug optional arch=any
 libpython3-all-dev deb libdevel optional arch=any
 libpython3-dbg deb debug optional arch=any
 libpython3-dev deb libdevel optional arch=any
 libpython3-stdlib deb python optional arch=any
 python3 deb python optional arch=any
 python3-all deb python optional arch=any
 python3-all-dbg deb debug optional arch=any
 python3-all-dev deb python optional arch=any
 python3-all-venv deb python optional arch=any
 python3-dbg deb debug optional arch=any
 python3-dev deb python optional arch=any
 python3-doc deb doc optional arch=all
 python3-examples deb python optional arch=all
 python3-full deb python optional arch=any
 python3-minimal deb python optional arch=any
 python3-nopie deb python optional arch=any
 python3-venv deb python optional arch=any
Checksums-Sha1:
 3989b9bd4f62ba0664e069590b41f16ce85117aa 146839 python3-defaults_3.13.5-1.tar.gz
Checksums-Sha256:
 6260f7e3b3df0c5fc60a95b26bd2da5993c6f8fcd901bab74c1c43df45d361dd 146839 python3-defaults_3.13.5-1.tar.gz
Files:
 545040f3f350d731407e8ad37cd088d5 146839 python3-defaults_3.13.5-1.tar.gz

-----BEGIN PGP SIGNATURE-----

iIoEARYKADIWIQTumtb5BSD6EfafSCRHew2wJjpU2AUCaGJQlxQcc3RlZmFub3JA
ZGViaWFuLm9yZwAKCRBHew2wJjpU2IPNAP9v+MmCzNqxWm1un1Twk1W7edlvRZup
LUXWO5B70Z8jZgD/Y8uD2P6F44/h38nbORILLRvo/zDzCDVa3yu1rZJ3SAs=
=C+z0
-----END PGP SIGNATURE-----
