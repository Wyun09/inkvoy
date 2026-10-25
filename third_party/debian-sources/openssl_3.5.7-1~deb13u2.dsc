-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: openssl
Binary: openssl, openssl-provider-legacy, openssl-provider-fips, libssl3t64, libcrypto3-udeb, libssl3-udeb, libssl-dev, libssl-doc
Architecture: any all
Version: 3.5.7-1~deb13u2
Maintainer: Debian OpenSSL Team <pkg-openssl-devel@alioth-lists.debian.net>
Uploaders: Christoph Martin <christoph.martin@uni-mainz.de>, Kurt Roeckx <kurt@roeckx.be>, Sebastian Andrzej Siewior <sebastian@breakpoint.cc>
Homepage: https://openssl-library.org
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/debian/openssl
Vcs-Git: https://salsa.debian.org/debian/openssl.git
Testsuite: autopkgtest
Testsuite-Triggers: perl
Build-Depends: debhelper-compat (= 13), dpkg-dev (>= 1.22.5), libzstd-dev, zlib1g-dev
Package-List:
 libcrypto3-udeb udeb debian-installer optional arch=any profile=!noudeb profile:v1=!noudeb
 libssl-dev deb libdevel optional arch=any
 libssl-doc deb doc optional arch=all
 libssl3-udeb udeb debian-installer optional arch=any profile=!noudeb profile:v1=!noudeb
 libssl3t64 deb libs optional arch=any
 openssl deb utils optional arch=any
 openssl-provider-fips deb utils optional arch=any
 openssl-provider-legacy deb utils optional arch=any
Checksums-Sha1:
 53d331880fbde8e6fe25870d5325a61201f6264d 53153930 openssl_3.5.7.orig.tar.gz
 9408998095f984b36591732286ef1df1ba7ce492 833 openssl_3.5.7.orig.tar.gz.asc
 6d1177d59ef985cff4b6baef95ae748ec724af12 74836 openssl_3.5.7-1~deb13u2.debian.tar.xz
Checksums-Sha256:
 a8c0d28a529ca480f9f36cf5792e2cd21984552a3c8e4aa11a24aa31aeac98e8 53153930 openssl_3.5.7.orig.tar.gz
 d3d082bee3f658c31db53af625eceecf29d777c7010394bed5787ebcc98abdf2 833 openssl_3.5.7.orig.tar.gz.asc
 593a47654ead460a3b609503733f80bef552ff0802799d3b47784faacc50809f 74836 openssl_3.5.7-1~deb13u2.debian.tar.xz
Files:
 36608cd5445f708d0c2200aea9682c35 53153930 openssl_3.5.7.orig.tar.gz
 1550a37dc3382ec617b5fd7d4140b92c 833 openssl_3.5.7.orig.tar.gz.asc
 1345084467bf31d9c7caf40647744577 74836 openssl_3.5.7-1~deb13u2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQGzBAEBCgAdFiEEV4kucFIzBRM39v3RBWQfF1cS+lsFAmqLE+wACgkQBWQfF1cS
+luckgv/d8ZIUqupKZMAic3DfE06BO8BCbyTkZsZbsZLgm7MnFbxSph3xcnypURw
T9Hj7WJS0qbLmVx7//tjTGXn4mX67cbGMEyMM1uMeeNizGP3wIsLbrmToOkuzDqp
ev1JgwJUYOBPTd8y3JGdp6FS8OlhTY9O1dzlP9w0rPqFGSlYkpokdrflBw9KYAdL
hyrfqKmlnEsXcQvoCp7Zs9CLpL3Yzlf73rqdQujLyGFig8EG16HGxcji4NUuI/AN
DZyTnT8ZW9knK0PwmxAcf3HLnTDg3gCCWdAJ/d8f8trqAuo2+Qs7mX+ZLNfJi4Cg
2pj0/bL+HU4TJHWX39AVvBOuFZ/pqoOxcYwaHY8Gdo399ecd4vyNqueNOcRqcOcq
nJYtqKFjF/GnPJ/s/sN8WaQA9vwmgXAqREi0tdLQPf+rqDaMp7l/eWywNrBOmPWz
S9dya+z4lIiqQT8+y9EMe3wXhceHrCLu/yoTkPgYRnBfPa43v+AGI1dwWTz5PTZ8
V1N9KO2R
=ES+V
-----END PGP SIGNATURE-----
