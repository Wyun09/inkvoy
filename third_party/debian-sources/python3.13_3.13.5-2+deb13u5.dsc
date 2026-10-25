-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: python3.13
Binary: python3.13, python3.13-venv, libpython3.13-stdlib, python3.13-minimal, python3.13-nopie, libpython3.13-minimal, libpython3.13, python3.13-examples, python3.13-dev, libpython3.13-dev, libpython3.13-testsuite, idle-python3.13, python3.13-doc, python3.13-dbg, libpython3.13-dbg, python3.13-full, python3.13-tk, python3.13-gdbm
Architecture: any all
Version: 3.13.5-2+deb13u5
Maintainer: Matthias Klose <doko@debian.org>
Uploaders: Stefano Rivera <stefanor@debian.org>
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/cpython-team/python3/tree/python3.13
Vcs-Git: https://salsa.debian.org/cpython-team/python3.git -b python3.13
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, ca-certificates, gdb, locales-all, python3-pip, python3-setuptools, python3-setuptools-whl, shunit2, systemtap-sdt-dev, virtualenv
Build-Depends: debhelper (>= 11), dpkg-dev (>= 1.17.11), quilt, autoconf, lsb-release, sharutils, libreadline-dev | libeditreadline-dev, libncurses-dev, zlib1g-dev, libbz2-dev, liblzma-dev, libgdbm-dev, libdb-dev, tk-dev, blt-dev (>= 2.4z), libssl-dev, libexpat1-dev, libbluetooth-dev [linux-any] <!pkg.python3.13.nobluetooth>, locales-all, libnsl-dev, libsqlite3-dev, libffi-dev (>= 3.0.5) [!or1k], libgpm2 [linux-any], media-types | mime-support, netbase, bzip2, time, python3:any, python3.13:any <cross>, net-tools, python3-pip-whl <!nocheck>, python3-setuptools-whl (>= 70.1) <!nocheck>, xvfb <!nocheck>, xauth <!nocheck>, tzdata <!nocheck>, systemtap-sdt-dev [!hurd-amd64 !hurd-i386], valgrind-if-available
Build-Depends-Indep: python3-sphinx, python3-sphinx-notfound-page, python3-sphinxext-opengraph, python3-docs-theme, texinfo
Package-List:
 idle-python3.13 deb python optional arch=all
 libpython3.13 deb libs optional arch=any
 libpython3.13-dbg deb debug optional arch=any
 libpython3.13-dev deb libdevel optional arch=any
 libpython3.13-minimal deb python optional arch=any
 libpython3.13-stdlib deb python optional arch=any
 libpython3.13-testsuite deb libdevel optional arch=all
 python3.13 deb python optional arch=any
 python3.13-dbg deb debug optional arch=any
 python3.13-dev deb python optional arch=any
 python3.13-doc deb doc optional arch=all
 python3.13-examples deb python optional arch=all
 python3.13-full deb python optional arch=any
 python3.13-gdbm deb python optional arch=any
 python3.13-minimal deb python optional arch=any
 python3.13-nopie deb python optional arch=any
 python3.13-tk deb python optional arch=any
 python3.13-venv deb python optional arch=any
Checksums-Sha1:
 dbf3aed444cbb2221eabfb52688aa371423aa0ba 22856016 python3.13_3.13.5.orig.tar.xz
 c41a1ec1f69513d48f9f1ac8e0aaa6614d9511c0 963 python3.13_3.13.5.orig.tar.xz.asc
 412b8df93c26d980ddcb4407728ec93504a898fa 299640 python3.13_3.13.5-2+deb13u5.debian.tar.xz
Checksums-Sha256:
 93e583f243454e6e9e4588ca2c2662206ad961659863277afcdb96801647d640 22856016 python3.13_3.13.5.orig.tar.xz
 da6e013d98dcf8fc6696cdb2872b0051fc8fdeb632f73ef9f54d7b5a68647401 963 python3.13_3.13.5.orig.tar.xz.asc
 a51f456e654ce2c9b40cc1db8005e5041cdb0b2c3aa96ab0871c49fe95280366 299640 python3.13_3.13.5-2+deb13u5.debian.tar.xz
Files:
 dbaa8833aa736eddbb18a6a6ae0c10fa 22856016 python3.13_3.13.5.orig.tar.xz
 397ab4a94059e647f47cf9a81f46543c 963 python3.13_3.13.5.orig.tar.xz.asc
 3c05432fbc5501a90208f9efd06f6e8c 299640 python3.13_3.13.5-2+deb13u5.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEtuYvPRKsOElcDakFEMKTtsN8TjYFAmqay4oACgkQEMKTtsN8
TjZ3MQ//S81yBAoKANH9eZo0GYQ5WA5hPqU8XuOfmC0ZIr/hcTaV92WrkiLDkmSY
9Ww7SpRM0MyVszOVRlMzJ+VPBg48oGocghhtSOjfTUqrpzlwzg2idRFiU7OOE7/b
6wXAe5NLrpoi2WQuIAmDh+cCMA0kVHEajdV35+bqARXmHXoRfGsXhDfQ8AKFQX50
HGeQ3CkRZVqyK1UtEazAKXyiWlEc4fevp3NKivikmyhHZnGkpvaCdUGZdgqKB7kM
kVeTmW90N7UnDuIzG1KWoJfstawvbuzAZj9jRitgv1Bn3EzByJB/gc7Y37Bs7j2g
htRn3RSV4IrZXXDGfy0GkVy0kLIEdSzTGdG0EIHn0STZV40RgSx0hmkJbETkxi/I
Nxv24uxGtDXdKrF89IioFB95TLArzJMhwm1cmGBZGhobMssrThgjAG1IpgV9Zxb+
/dBci158fN1kUzp2QD1KiwHtZA9izdVZoVghCiN8lbebiYdZ7QuYrPZ1YId0J1n/
eg2nYQbHVAwLkAE2+d9qYOwitsjCH9a5f5GQMRHDf6UvKPAmAXk6LhJKMxpKFMkD
Y/OhVefZzsYqOiyQ9bBFxSCLUZ3Dn9mcMllpuFk9CBHIWz4ueMjR80FrP+0YFa07
p12ZDRjS514leUQKIATR1tNHgcRXRn8zPiUCTlSDs3CF12AkFow=
=Z+zx
-----END PGP SIGNATURE-----
