-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: libzstd
Binary: libzstd-dev, libzstd1, zstd, libzstd1-udeb
Architecture: any
Version: 1.5.7+dfsg-1
Maintainer: RPM packaging team <team+pkg-rpm@tracker.debian.org>
Uploaders:  Peter Pentchev <roam@debian.org>,
Homepage: https://github.com/facebook/zstd
Standards-Version: 4.7.1
Vcs-Browser: https://salsa.debian.org/pkg-rpm-team/libzstd
Vcs-Git: https://salsa.debian.org/pkg-rpm-team/libzstd.git
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, cmake, pkgconf, python3, python3-click, python3-typedload
Build-Depends: debhelper (>> 13.15.2~), dh-package-notes, dpkg-build-api (= 1), cmake (>= 3.24~), help2man, less <!nocheck>, liblz4-dev, liblzma-dev, python3 <!nocheck>, zlib1g-dev
Package-List:
 libzstd-dev deb libdevel optional arch=any
 libzstd1 deb libs optional arch=any
 libzstd1-udeb udeb debian-installer optional arch=any profile=!noudeb
 zstd deb utils optional arch=any
Checksums-Sha1:
 232037627d9d8bd80033e4316bdb62f737c9968f 1834780 libzstd_1.5.7+dfsg.orig.tar.xz
 899c78a644062eefb4cb056a23e22c5aed8cd4f4 23036 libzstd_1.5.7+dfsg-1.debian.tar.xz
Checksums-Sha256:
 0c092ef267edce57ba7f3f2645c861f72eaf5e76273c6c3632869423464b90a5 1834780 libzstd_1.5.7+dfsg.orig.tar.xz
 5e88424d919941291f79e1bfada6cb1a6f748671d9de7d4b7d931f361f183a15 23036 libzstd_1.5.7+dfsg-1.debian.tar.xz
Files:
 258d522e11ab527e98af8f52211deb5b 1834780 libzstd_1.5.7+dfsg.orig.tar.xz
 7178e5d8cf5b9b5d3edcd68360bebfca 23036 libzstd_1.5.7+dfsg-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEELuenpRf8EkzxFcNUZR7vsCUn3xMFAmfTVaAACgkQZR7vsCUn
3xND0xAAl+YSgQZM5L65C8HeGXKCbLqv6CbQWZrWXO4SEmKGgIPqGOaS+XgatFnK
8jIBy9DywVYn3XETDGg+xD2ptMbSyRW7V97QE7uGt5fYqkn9XGgu43fMgDCT10AH
SlvUn1t7wL+Pn0ah0gaQ8qdaIYyaFhYgWpyoxM6DiH6+8Zbf9UlEKxBOAQXNOR1u
8Svr2obGdLtOYIyLo//YR2QhBQKE+tM4JEfv28Ga6Pk5ZMzn95k8eW9k6GLJUM2X
LmLQcwgqtmEPtZQPfgsXrpk8AkkCBEF05izC/Qyj2EUAVNtV4c0jsGtgsnfEO+DU
qiqnkNP9WLgUUpH/SCEwxeXDiOGT3FCFsDL28N1Dy1Di43CHY7lO/ioo8Q4hRHfw
LOlPav0VAs8W5aRw+XwA9pJybt+gsP9FSfQGPZ+dYjTLriM7fLurvnHnLrUoFq59
4Lz8W9FljyxlbLkf9WKLTnDI+9t+vYLOlFAFcAzBzOmWBkzsVVphpBVpp3YQvTvE
A/IH0Xn0JyKQ+lGhqdeNJKNExYYnpm6G63shaSYTkba7ZMEOdRQnivXAd4Gbfc2N
aytWS3h74VbPvTKnTbIsnFLH3NWO1JYWfwufFCwzvJxy/EKdF4Oqu7zdrigqh4jL
hs+r0J9c6CS8qxc9Va1Be9y05k5w0fmOIMoUzSDdOw6nxkxxeNQ=
=I4x4
-----END PGP SIGNATURE-----
