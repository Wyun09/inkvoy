-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: python-packaging
Binary: python3-packaging, python3-packaging-whl
Architecture: all
Version: 25.0-1
Maintainer: Debian Python Team <team+python@tracker.debian.org>
Uploaders: Matthias Klose <doko@debian.org>, Dmitry Shachnev <mitya57@debian.org>
Homepage: https://github.com/pypa/packaging
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/python-team/packages/python-packaging
Vcs-Git: https://salsa.debian.org/python-team/packages/python-packaging.git
Testsuite: autopkgtest-pkg-pybuild
Build-Depends: debhelper-compat (= 13), dh-python, python3-all, python3-pretend, python3-pyparsing, python3-pytest, pybuild-plugin-pyproject, flit
Package-List:
 python3-packaging deb python optional arch=all
 python3-packaging-whl deb python optional arch=all
Checksums-Sha1:
 17c5e55599766795df2bc4b6b3661056fc7ff7ef 165727 python-packaging_25.0.orig.tar.gz
 e4122fb975961f9f7c271bd99f6d42efe846ac03 4144 python-packaging_25.0-1.debian.tar.xz
Checksums-Sha256:
 d443872c98d677bf60f6a1f2f8c1cb748e8fe762d2bf9d3148b5599295b0fc4f 165727 python-packaging_25.0.orig.tar.gz
 223e23fe0d0aa4000633cdc9022cde6e15dc7f6630e49f8bbabeaca45f2bf376 4144 python-packaging_25.0-1.debian.tar.xz
Files:
 ab0ef21ddebe09d1803575120d3f99f8 165727 python-packaging_25.0.orig.tar.gz
 f5933a8b0dff7bb1ae27b51942dd4558 4144 python-packaging_25.0-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iIoEARYKADIWIQTumtb5BSD6EfafSCRHew2wJjpU2AUCaAzc2xQcc3RlZmFub3JA
ZGViaWFuLm9yZwAKCRBHew2wJjpU2JjsAQC4Gd5FI0xzwgcP9JGKgDJ+EPs2/MN8
j8xPXt4GmgINUAEA0gyBT7aek2YeA5vMGKzRM0N0sQlKr1Homrco7s6CFQA=
=+8cG
-----END PGP SIGNATURE-----
