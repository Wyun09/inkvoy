-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: wheel
Binary: python3-wheel, python-wheel-common, python3-wheel-whl
Architecture: all
Version: 0.46.1-2
Maintainer: Debian Python Team <team+python@tracker.debian.org>
Uploaders: Stefano Rivera <stefanor@debian.org>
Homepage: https://github.com/pypa/wheel
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/python-team/packages/wheel
Vcs-Git: https://salsa.debian.org/python-team/packages/wheel.git
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, coreutils, python3-all-dev, python3-pytest, python3-pytest-cov, python3-setuptools
Build-Depends: debhelper-compat (= 13), dh-python (>= 6), flit, pybuild-plugin-pyproject, python3-all-dev, python3-packaging (>= 24) <!nocheck>, python3-pytest <!nocheck>, python3-pytest-cov <!nocheck>, python3-setuptools (>= 77) <!nocheck>, python3-sphinx <!nodoc>, tox (>= 4) <!nocheck>
Package-List:
 python-wheel-common deb python optional arch=all
 python3-wheel deb python optional arch=all
 python3-wheel-whl deb python optional arch=all
Checksums-Sha1:
 c4946a33210e28ff5199b851d322be12be6a0f4b 54400 wheel_0.46.1.orig.tar.gz
 cafd742e0eb4bbf0a8cf41e6b38963a1ea901025 7296 wheel_0.46.1-2.debian.tar.xz
Checksums-Sha256:
 fd477efb5da0f7df1d3c76c73c14394002c844451bd63229d8570f376f5e6a38 54400 wheel_0.46.1.orig.tar.gz
 32cc380ea11c860f051d27321aabadc03f247ee7ceb48ca693624c22e3c2e293 7296 wheel_0.46.1-2.debian.tar.xz
Files:
 65e09ee84af36821e3b1e9564aa91bd5 54400 wheel_0.46.1.orig.tar.gz
 b6bec64c06d5afb701382e9da110fe3f 7296 wheel_0.46.1-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iIkEARYKADIWIQTumtb5BSD6EfafSCRHew2wJjpU2AUCZ/rrlRQcc3RlZmFub3JA
ZGViaWFuLm9yZwAKCRBHew2wJjpU2D69APYyIfpcnx0acZr/UxCHixxnPVjSW8KX
NsLzOC9xP6UnAQCHq2d26Y0YqQHjLrl3pX65iScckCF5gia6ISFlO6TKBQ==
=JAkk
-----END PGP SIGNATURE-----
