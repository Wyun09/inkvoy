-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: node-undici
Binary: node-undici, node-llhttp, libllhttp-dev, libllhttp9.2
Architecture: any all
Version: 7.3.0+dfsg1+~cs24.12.11-1
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders: Yadd <yadd@debian.org>
Homepage: https://undici.nodejs.org
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/js-team/node-undici
Vcs-Git: https://salsa.debian.org/js-team/node-undici.git
Testsuite: autopkgtest
Testsuite-Triggers: chai, jest, mocha, node-busboy, node-chai-as-promised, node-debug, node-p-timeout, node-proxy, node-proxy-agent, node-sinon, node-tap, pkg-js-autopkgtest
Build-Depends: debhelper-compat (= 13), dh-sequence-nodejs (>= 0.14.22~), binaryen, clang (>= 1:16), cmake, libclang-rt-dev-wasm32, lld (>= 1:16), node-debug, node-esbuild, node-semver, node-typescript, ts-node, wasi-libc
Package-List:
 libllhttp-dev deb libdevel optional arch=any
 libllhttp9.2 deb libs optional arch=any
 node-llhttp deb javascript optional arch=all
 node-undici deb javascript optional arch=all
Checksums-Sha1:
 46b46af6495b75a900886a20879c5de0543c5e5c 2772 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-binary-search.tar.xz
 330196935b4cf6261978426ba45c487eafa50fa5 39820 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-fastify-busboy.tar.xz
 ef48cda13fd92796204586a0ff32b34d062c378a 5900028 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llhttp.tar.xz
 45faa0054d37a1b6a6a463a428fb6d0cb6a8c23f 27872 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse-builder.tar.xz
 0f1a8a40daf6fb490f3c283448085ce013d09716 28840 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse-frontend.tar.xz
 61d3690843470b12531fbbc6ebf3587405d22151 34392 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse.tar.xz
 712ab993773d67e60634f7f3fc56c45f420aa39f 1773980 node-undici_7.3.0+dfsg1+~cs24.12.11.orig.tar.xz
 4166c7a979b4b298b50d7bbe3a7a3d7bc668432b 214960 node-undici_7.3.0+dfsg1+~cs24.12.11-1.debian.tar.xz
Checksums-Sha256:
 4c722d476f84b280160bfc428aa36e2806f9837902a43cda7caaa401c2a52f54 2772 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-binary-search.tar.xz
 d3e5c5dfc8aba040287b99e267ecdbea45a822f04f2cb3837e4662deeb32c2c6 39820 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-fastify-busboy.tar.xz
 9bd346147fa1f7ac096360620189b30284a5537bfbdf8db9da40ed12fe3fe42a 5900028 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llhttp.tar.xz
 48fc4ad3744179216d30f36e22a4e72bd11b6f47165f1bd22144436ba535b8f3 27872 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse-builder.tar.xz
 30e1c7809fc5b31bf63e8f3b6eaa8ff0f08910fa131294d46a3f33c849fd7f0e 28840 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse-frontend.tar.xz
 ca5062636558b8171ef7309fa829179258d2fb04914ade2ba663ce42970fe32a 34392 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse.tar.xz
 be8ad414aa10f1ef097000a5d9c2d3a04bedcfcd18cf38b363bf16c00828325b 1773980 node-undici_7.3.0+dfsg1+~cs24.12.11.orig.tar.xz
 26547ee0207810368054b4063f2aa1ef00e6800a9170198e0b796540fb2453be 214960 node-undici_7.3.0+dfsg1+~cs24.12.11-1.debian.tar.xz
Files:
 00109915720120e4ee6ade7582b2b365 2772 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-binary-search.tar.xz
 94597c871b16a404e1bdcb23d0cb7bc1 39820 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-fastify-busboy.tar.xz
 bc4748a7440fd00f978b48379d8777c5 5900028 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llhttp.tar.xz
 af1818fe0c7e2939d19e35f3e7f80f91 27872 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse-builder.tar.xz
 ebf8b8761d2ec86b375e5f0c0be1b320 28840 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse-frontend.tar.xz
 825b830bb267ecbcb761428a7b4c80e1 34392 node-undici_7.3.0+dfsg1+~cs24.12.11.orig-llparse.tar.xz
 c9406ebcdbc35e6a39c3c997af638ec4 1773980 node-undici_7.3.0+dfsg1+~cs24.12.11.orig.tar.xz
 21dfc561b2fba238a7fb92514eaa2e5b 214960 node-undici_7.3.0+dfsg1+~cs24.12.11-1.debian.tar.xz
-----BEGIN PGP SIGNATURE-----

iQJGBAEBCAAwFiEEA8Tnq7iA9SQwbkgVZhHAXt0583QFAmeWU+kSHGthcG91ZXJA
bWVsaXgub3JnAAoJEGYRwF7dOfN0kI8P/iTJGCao9BOzKZDqTC/Q+e7vI7kzN9vZ
g6vbNuS0Xd8QoMwecVqy9grtGzyGcsPlD8DxkUdL+Haupku3ETydacKH510GWOcl
6+ZO8IyDYi1Apoehd8iE6txzbf6qgKa9UTj/9of4fAIuysOHhR1ebC+Ksu82FLDm
L3Jl/X/x6b8JCwPhmmTMdqGUg7sC+0JKe28/Ko8gNzi2CtQeX0ijbnCDEdORX4/q
fs5TYQM+wIbr1rJTJY8GK0bnnYOgoEk5uHXAojtufUly92GwcTlyYOHDfP6nLa/e
P+l1RXHZrh/EQnY7tz94jhc2k+5aB2NzRfQ0ZekZMtTViIyAqZbCeiB9R5Gddy0H
u/VS0aSKY+xlEMBwJXUYcFyqzR8N+2nisYAUfBx1Kpe4B13qny8uNccgkI+3TyzW
8o5u8lNtDODKlAbjYtTWT6uRp3bqATZr1YPMqPk8jM+lBLyoKe7qpinWo1JcXw0d
tubthDQ8hzHcnB4+PUMlqnvqSwx448X1iAihKCZPWHU9dtf4ww3DY1vsOKFN0+wj
XNWZtzwZ7yqnCmSfzM4onnMFooQL4cxsf5SvXiLUDzh8tRam7MUJzQEKuo316jAG
ZbNoB6Nx+76MbX84GYr1+9Gr7wpg93kV7qmAyrG847LjaBZFQH5ZF7HHkdmChzm7
5gIPrTLsR4hT
=bcoo
-----END PGP SIGNATURE-----
