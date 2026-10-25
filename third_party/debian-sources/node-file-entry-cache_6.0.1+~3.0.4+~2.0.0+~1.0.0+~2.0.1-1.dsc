-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: node-file-entry-cache
Binary: node-file-entry-cache, node-flat-cache, node-write
Architecture: all
Version: 6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1-1
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders:  Jonas Smedegaard <dr@jones.dk>,
Homepage: https://github.com/royriojas/file-entry-cache
Standards-Version: 4.6.2
Vcs-Browser: https://salsa.debian.org/js-team/node-file-entry-cache
Vcs-Git: https://salsa.debian.org/js-team/node-file-entry-cache.git
Testsuite: autopkgtest
Build-Depends: debhelper-compat (= 13), eslint <!nocheck>, jq, mocha <!nocheck>, node-chai <!nocheck>, node-del <!nocheck>, node-flatted <!nocheck>, node-glob <!nocheck>, node-js-yaml <!nocheck>, pandoc <!nodoc>
Package-List:
 node-file-entry-cache deb javascript optional arch=all
 node-flat-cache deb javascript optional arch=all
 node-write deb javascript optional arch=all
Checksums-Sha1:
 364cbfe38d1b73b571603146e4aca6ac9be43f0e 13260 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xadd.tar.gz
 2bae45c85c64d0d56133620d05f589def9e1a678 36693 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xflat.tar.gz
 9ba65e8ce176c5f1c5163ed04a6d8d2b10c01c6c 9277 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xstrip.tar.gz
 caf31ef6533fd93982a69dd6977c22d15a621ca0 8635 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xwrite.tar.gz
 d52569d70ee17be18f31ab30ecad81267b49dc70 69145 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig.tar.gz
 b1a85d777082bbb5bac457ae7df054850aa8e3b0 7500 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1-1.debian.tar.xz
Checksums-Sha256:
 2bcf147704f62f1ebf3e22a41d50a8f5b49b39151219efc3973984f604c2ee65 13260 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xadd.tar.gz
 aca0fcdd61c01a0aa437eb08ac40c7040da4a2a634d116be0347e69498d0c7bf 36693 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xflat.tar.gz
 da74569a4701fb8808c8b896032da5251c8fb3ac617e3ff7f37e8874add301c7 9277 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xstrip.tar.gz
 e67f1b6a68c6c50685b0f85fbec361560621a533f7a777635854bde9dbc58837 8635 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xwrite.tar.gz
 2164de1d104a7ae6328b6c71ec8d69ca9e3131ca842ab0b9e7e1f2e097dec012 69145 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig.tar.gz
 f587559b05f4d946eaeea8490d8beac5e7393e089b73144fc9db47325ead3285 7500 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1-1.debian.tar.xz
Files:
 9ce4f9647661125ed2c38c2ead84f100 13260 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xadd.tar.gz
 b45500d9dce64f6699c0e55661cd70a8 36693 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xflat.tar.gz
 252d2a343ec5cd04250ce8e065ffa506 9277 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xstrip.tar.gz
 d709060d6c8b1ff722897f5dd11f3526 8635 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig-Xwrite.tar.gz
 402db160575a48687bac0c2b6cf4f4fe 69145 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1.orig.tar.gz
 f1e86dfc5b6bc900656480d900397475 7500 node-file-entry-cache_6.0.1+~3.0.4+~2.0.0+~1.0.0+~2.0.1-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEn+Ppw2aRpp/1PMaELHwxRsGgASEFAmTfCsQACgkQLHwxRsGg
ASHRLA/+LAxXuFWqi5bPFNUI+fECpDgeUbTKT4DeDt2IhWzAvKopGrEmRsdeU1T5
4aNm8evh270Q2zmIzXwHoqdRUWBHp7iDyw+VvBvShZS1ufvRapoqkFwat2eYDTfX
GaNaF1txSmhpFe12h+wRbffsxn20Ksc2+KPcG1+hXzpxT5DbJVvwB3FMqhZVqjYr
4U8uYA13xMyOazVhrltQyDk3HGqj0RAhu9m3np7vXh0uv9/D/Y0AvSWswOCIXogY
10fDqvjLSj00nSi7hbW0Yrvkw7pqY2hyDjHF9QYmfuGG/cy7VhB5fYr7aarzcnla
H63zI/8G4SjfboXK7dqsjIEYo9VVqgKu5SJ/VsjMwymziqNb7Cp6xPMTNYid51mh
hiM6PGW7o4jK5ubzAYCxbg2wuald72eTA5/Xsz7W0IHPk+qUidx84fDaxwc05aJ/
5Sxv1Zka7Pj+43/QtES76p2gBcJcczFfIDxtLabbcwYpS394cCUrq63InFTzs5Yv
giZChU5XRRaFDokn3bK3ol7Hwj9d+D6JTjfAKx71rHKQTKGUVM66k/Ot9fJisDa6
iP5ccwsE8CQWktX2amx/o/NrKkyLPZ3gQZ8byOe2nBJrlpk9XCacsdZ9xKJaom0r
d3D3qzcgh92JTp/+Jqb3fDiKG2oHkmMKgUt4N9O7A3boVIxI6LI=
=l0ds
-----END PGP SIGNATURE-----
