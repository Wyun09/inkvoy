-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: node-terser
Binary: node-terser, libjs-terser, terser
Architecture: all
Version: 5.38.0-1
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders:  Jonas Smedegaard <dr@jones.dk>,
Homepage: https://terser.org/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/js-team/node-terser
Vcs-Git: https://salsa.debian.org/js-team/node-terser.git
Testsuite: autopkgtest
Testsuite-Triggers: libjs-source-map, libtest-command-simple-perl, node-domino, node-jridgewell-source-map, nodejs, perl
Build-Depends: brotli, cmark-gfm <!nodoc>, debhelper-compat (= 13), eslint <!nocheck>, help2man <!nodoc>, mocha <!nocheck>, node-acorn, node-commander (>= 7), node-escodegen <!nocheck>, node-jridgewell-source-map, node-rollup-plugin-terser, node-semver <!nocheck>, node-source-map <!nocheck>, pigz, rollup (>= 0.61.0)
Package-List:
 libjs-terser deb javascript optional arch=all
 node-terser deb javascript optional arch=all
 terser deb javascript optional arch=all
Checksums-Sha1:
 7e3801fc259321e447a4a8998b2aed85b401b404 527393 node-terser_5.38.0.orig.tar.gz
 d42969dcc5656a96b4c66eb1b2fba84925292447 14424 node-terser_5.38.0-1.debian.tar.xz
Checksums-Sha256:
 4648eb7359d82955d0086dbbc890abd4b642d2dafce56b682aabdeba8c6e182c 527393 node-terser_5.38.0.orig.tar.gz
 60d9f7f9fdd6ed6ef3f743af37a1f49dfb96e64e77834f71002eb8a50ffa2353 14424 node-terser_5.38.0-1.debian.tar.xz
Files:
 b8a8fadd52319fc07322ab8d9b0d8a2c 527393 node-terser_5.38.0.orig.tar.gz
 628c636696a209084db3c897ed35b3d2 14424 node-terser_5.38.0-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEAN/li4tVV3nRAF7J9tdMp8mZ7ukFAmekV5sACgkQ9tdMp8mZ
7un1mBAAh0wHYWzVeVA3RfhKagPIBuIdDM7OFcERUTqQLGDUUs3p1kPRcg6lrx8o
I5H03EHPJV5RtTAmjSeKXBJyTtLz3oD/qV24kjgz677u0KOEpwKnhvQ8xGrPq4pd
j8Wph/cgmuUfbBXG4LFXcIbEKgW2gKFY1hVIqzuTrfib9DKbvi7PBenQTjjElhqM
6GEG3yj+3uM+tAuLe+I+sjHTVEY01g8btx2fX27oV8s02u8pOQaW2B44W2uiMcUe
pqY+TL8xCH4NSoI9Y6RANLhA/XemiJ1YnYfONOBG+vdA/4oj5NMWIha3seJ7T96+
AHs+IghiVDivrKTuIW7j/C+MnXNOD6b1UVAknmFlWRiEBt/H6+eEZHeQddKiY9AZ
IRDEyob2skzIpwTR/8fVDzz8oOFvP4zIefGv70WIlUUkZpcxS7hgAxXbjGeW3AgI
xNifIqeWTrpmVF6/cmODOglLYW46kwcIg1ixveD3tkO2WvTNFIzVyVtUfDiUcxpo
UNk108nKvUxSgRjpwqsNc3sIN3Z17QNBnpoVF1HIOvwl1IFw4YxqccKufu1X+g6e
T+NLhJzM7U7+R/i/nLlTW1RHWZIYsCXRFHjDqUg7N5L0+2RhmR2SAXu82HjGGNB5
N1vkm3qniz6gFlKaR3ISeluiVUsmWahvs51rRo5Imc9VKzRQYuc=
=jFiz
-----END PGP SIGNATURE-----
