-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (native)
Source: dpkg
Binary: dpkg, libdpkg-dev, dpkg-dev, libdpkg-perl, dselect
Architecture: any all
Version: 1.22.22
Maintainer: Dpkg Developers <debian-dpkg@lists.debian.org>
Uploaders: Guillem Jover <guillem@debian.org>
Homepage: https://wiki.debian.org/Teams/Dpkg
Standards-Version: 4.7.2
Vcs-Browser: https://git.dpkg.org/cgit/dpkg/dpkg.git
Vcs-Git: https://git.dpkg.org/git/dpkg/dpkg.git
Testsuite: autopkgtest
Testsuite-Triggers: autoconf, build-essential, eatmydata, file, libmd-dev, pkgconf
Build-Depends: debhelper-compat (= 13), debhelper (>= 13.10~), pkgconf, gettext (>= 0.19.7), po4a (>= 0.59), libmd-dev, zlib1g-dev, libbz2-dev, liblzma-dev (>= 5.4.0), libzstd-dev (>= 1.4.0), libselinux1-dev [linux-any], libncurses-dev (>= 6.1+20180210), bzip2 <!nocheck>, xz-utils (>= 5.4.0) <!nocheck>, zstd <!nocheck>, git <pkg.dpkg.author-release>, ca-certificates <pkg.dpkg.author-release>, libmodule-build-perl <pkg.dpkg.author-release>, fakeroot <pkg.dpkg.author-testing>, sq <pkg.dpkg.author-testing>, sqv (>= 1.3.0~) <pkg.dpkg.author-testing>, sqop <pkg.dpkg.author-testing>, sqopv <pkg.dpkg.author-testing>, rsop <pkg.dpkg.author-testing>, rsopv <pkg.dpkg.author-testing>, gosop <pkg.dpkg.author-testing>, gpg-sq <pkg.dpkg.author-testing>, gpgv-sq <pkg.dpkg.author-testing>, gnupg <pkg.dpkg.author-testing>, cppcheck <pkg.dpkg.author-testing>, shellcheck <pkg.dpkg.author-testing>, aspell <pkg.dpkg.author-testing>, aspell-en <pkg.dpkg.author-testing>, codespell <pkg.dpkg.author-testing>, i18nspector <pkg.dpkg.author-testing>, libtest-minimumversion-perl <pkg.dpkg.author-testing>, libtest-perl-critic-perl <pkg.dpkg.author-testing>, libtest-pod-coverage-perl <pkg.dpkg.author-testing>, libtest-pod-perl <pkg.dpkg.author-testing>, libtest-spelling-perl <pkg.dpkg.author-testing>, libtest-strict-perl <pkg.dpkg.author-testing>, libtest-synopsis-perl <pkg.dpkg.author-testing>, lcov <pkg.dpkg.code-coverage>, libdevel-cover-perl <pkg.dpkg.code-coverage>
Package-List:
 dpkg deb admin required arch=any essential=yes
 dpkg-dev deb utils optional arch=all
 dselect deb admin optional arch=any
 libdpkg-dev deb libdevel optional arch=any
 libdpkg-perl deb perl optional arch=all
Checksums-Sha1:
 3f562f6937e1df756e7275a303914f0efaa3c377 5746724 dpkg_1.22.22.tar.xz
Checksums-Sha256:
 d5ea9f132deec8030b50ab2a02ade2b49f0c7a195805a302c8301156fe833a57 5746724 dpkg_1.22.22.tar.xz
Files:
 87e8823109f047a499c2263f0c7ad774 5746724 dpkg_1.22.22.tar.xz


-----BEGIN PGP SIGNATURE-----

wsG7BAEBCgBvBYJpqkbUCRC5cr8+pK5Xo0cUAAAAAAAeACBzYWx0QG5vdGF0aW9u
cy5zZXF1b2lhLXBncC5vcmekWXSLkS/4xxaprNFxIhiz6tp/n3raYTdjF8rELv7m
8hYhBE8+dPQ2BQwQ9WlldLlyvz6krlejAAA4WRAAsAsm7z52GtCrVqEVchE5gK80
5MX/Nbt7JwDfqAOrv3gAuCwMcoFZRTYooOAAJU20MrxORweHpWXlOF4siesHXKl/
JUoG8Ow0hYxng5k0wVfZofMAxZ5zUXgLqsmi4bfK1Db1PsnbuOFB2/2ck3GjFkv3
2gn4aJ9dDm4CLgwUjGZ+Zo37II5YmUUYUDSLf0X6/I43Fy5lTeHZZR+pZ4l9kjZq
ShCn5XvO9NDYFN/dBak7Vrkwb5OOwPHkfPCS0lmBSIJ27lTxB2qmMh48LIPQGfkO
6XgGpDj4OacuGXuFceDoP9e6uqZvvn0xWfzw33EJvoDF7wf+d3LKkpLBNVWmjDCm
9LJ9gScqDJ7PEr7sbVhknootCSphHB7kkaN15RApAUlqYVOqv41u0vigS56SlcLF
TV1D8B4kKMfcihescbW5i1wWEINMuArKuxGFVbzZPZynhvVYx9AUt0921PMKCv7J
IBT7ij5ayijz7Pt+ewxzU4xElFzJKTY6jHB//eF+PrR0b00S/XAO3SU3MiUDV5GB
Bm1rtIaySzmZTfuEMu+JX8nlkm/PPNKdq69f/HidmG49GQN6sb2bkSn73p0UNusb
P5vYelqlKEG06lj+Yh65WVybU5diswR2fEBNCentmIiA/J2NnxhHOApdNw+YjcX8
3jFO+35RZRaLxfJsfOI=
=V9Vk
-----END PGP SIGNATURE-----
