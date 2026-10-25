-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: python-pip
Binary: python3-pip, python3-pip-whl
Architecture: all
Version: 25.1.1+dfsg-1
Maintainer: Debian Python Team <team+python@tracker.debian.org>
Uploaders: Carl Chenet <chaica@debian.org>, Stefano Rivera <stefanor@debian.org>,
Homepage: https://pip.pypa.io/en/stable/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/python-team/packages/python-pip
Vcs-Git: https://salsa.debian.org/python-team/packages/python-pip.git
Testsuite: autopkgtest
Testsuite-Triggers: python3-venv
Build-Depends: debhelper-compat (= 13), dh-sequence-sphinxdoc <!nodoc>, furo <!nodoc>, pybuild-plugin-pyproject, python3, python3-doc <!nodoc>, python3-myst-parser <!nodoc>, python3-setuptools (>= 44.0.0), python3-sphinx (>= 7) <!nodoc>, python3-sphinx-copybutton <!nodoc>, python3-sphinx-inline-tabs <!nodoc>, python3-sphinx-issues <!nodoc>, towncrier <!nodoc>
Package-List:
 python3-pip deb python optional arch=all
 python3-pip-whl deb python optional arch=all
Checksums-Sha1:
 39ebe198a326a0b56f7eaaf77acd271ed4263dbe 1183756 python-pip_25.1.1+dfsg.orig.tar.xz
 263060d6700f897a1fff416efa2eaafcfed8947e 21856 python-pip_25.1.1+dfsg-1.debian.tar.xz
Checksums-Sha256:
 009f74ecae126d3a68e18e9069fa67a536878555c1be6a1630fe86c109c83cf3 1183756 python-pip_25.1.1+dfsg.orig.tar.xz
 b0fa2c4a19bbe7206b26367f6761208390aaf29802dfc2e9200a167d3dfa3a65 21856 python-pip_25.1.1+dfsg-1.debian.tar.xz
Files:
 a39d2f9b0da3c6ece95042b3ad2188e9 1183756 python-pip_25.1.1+dfsg.orig.tar.xz
 319010e0c1b04e185d7c3db0fde8e4de 21856 python-pip_25.1.1+dfsg-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iIoEARYKADIWIQTumtb5BSD6EfafSCRHew2wJjpU2AUCaBT7CBQcc3RlZmFub3JA
ZGViaWFuLm9yZwAKCRBHew2wJjpU2AgcAP9Pg7s467KbUIuyR29GQsnBeIRkU345
59qhIdXC/ocz0gD/dZDkg+AFk1wBweTQn3l9FL/E6pu1jU0hPqt/vMUyhwY=
=zqVm
-----END PGP SIGNATURE-----
