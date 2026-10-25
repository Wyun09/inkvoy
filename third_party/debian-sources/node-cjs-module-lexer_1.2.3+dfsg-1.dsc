-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: node-cjs-module-lexer
Binary: node-cjs-module-lexer
Architecture: all
Version: 1.2.3+dfsg-1
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders: Jérémy Lal <kapouer@melix.org>
Homepage: https://github.com/nodejs/cjs-module-lexer#readme
Standards-Version: 4.6.2
Vcs-Browser: https://salsa.debian.org/js-team/node-cjs-module-lexer
Vcs-Git: https://salsa.debian.org/js-team/node-cjs-module-lexer.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, nodejs, pkg-js-autopkgtest
Build-Depends: debhelper-compat (= 13), dh-sequence-nodejs, clang, lld, mocha <!nocheck>, node-babel-cli, node-babel-core, node-babel-plugin-transform-modules-commonjs, terser, wasi-libc
Package-List:
 node-cjs-module-lexer deb javascript optional arch=all
Checksums-Sha1:
 a2df34686a1872ec58da5230093a3d334b788a2d 46632 node-cjs-module-lexer_1.2.3+dfsg.orig.tar.xz
 e651c2b5802ae4ffe51d6a0d5dffe12cad6d8f30 3972 node-cjs-module-lexer_1.2.3+dfsg-1.debian.tar.xz
Checksums-Sha256:
 3435c56f1cf169ba0b6154b1a51b47c6516e06701f63b7b69aaeb6b0f28d866d 46632 node-cjs-module-lexer_1.2.3+dfsg.orig.tar.xz
 92e8d65c44a13c2c6fe1d7729ad8c25bea815082c48e7f1f11fdbe151e3f9b0c 3972 node-cjs-module-lexer_1.2.3+dfsg-1.debian.tar.xz
Files:
 dc68b97265472d4167ba7c1c4d31b755 46632 node-cjs-module-lexer_1.2.3+dfsg.orig.tar.xz
 7fe3608405de1b776a04af81494e2be6 3972 node-cjs-module-lexer_1.2.3+dfsg-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEAN/li4tVV3nRAF7J9tdMp8mZ7ukFAmWuRDkACgkQ9tdMp8mZ
7unV7g/+PaHh5c1GjcvcUu5FWT4TocHZUz74VB5HSgdfTE/eL67TBFCdLjqJ0zWj
fEHiFGSbWpciQIVdVgccxDl49u31HR29uWgyr4WPI/pSbzLJVegEqv4RjxWdVGdB
uCEgNa4aVzE92/X7JCC2jheZAaSFxadm/E2sJtpaFo1PvWb8eSH3QYbz5wXcEpN3
P1e5nmNH2ykAdaiF5v3AXJYFLkHYOEVf39sHVo4DJ71j16LQlvFrcvqYh8bf2tms
YvCBe8tyRrBSyJLbVvOp20CIoArsHX/iFlQLAvKLpUqfZkKTLBM44AzeAkeUQxp8
+J2dqfEid5ofbnTQdo0mKLPXE3HXt+5gdILcuMQ5ZMld4JkxMgOuSBmOwabMe8Zh
mUcf4jlM+7gFoNKF84C0p8aTs8Wq52ZHza+d93o2LE4m35TXdsDC2VCUqRn+DRf9
GHTQHqbo5JIZiA6hhZxM+M6Gi/ouJr3uUhaC8xfkc6Pnd6tUGyhxGNqq2un5Wi7g
aep1UkA3/LlBkl/qt1BpP6BUd6QDZqPnUJZYAV2B2K49CuGPNDUghjooCkNSOxxj
4Rq0K8gJ8olM1NVOl9HZqj6U8M2+xNWEYP3E77vthA1xGSxFCOW0d74wM0cmBARR
JjcCvNcT0YAZsiRcGQTB6ini3gQVJk3j4gUYesGaWC1aK6wtcAk=
=mWVG
-----END PGP SIGNATURE-----
