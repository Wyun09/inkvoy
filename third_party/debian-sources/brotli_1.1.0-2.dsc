-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: brotli
Binary: python3-brotli, brotli, libbrotli-dev, libbrotli1
Architecture: any
Version: 1.1.0-2
Maintainer: Tomasz Buchert <tomasz@debian.org>
Uploaders: Ondřej Surý <ondrej@debian.org>
Homepage: https://github.com/google/brotli
Standards-Version: 4.6.2
Vcs-Browser: https://salsa.debian.org/debian/brotli
Vcs-Git: https://salsa.debian.org/debian/brotli.git
Testsuite: autopkgtest
Testsuite-Triggers: python3-all
Build-Depends: cmake, debhelper (>= 13), debhelper-compat (= 13), dh-python <!nopython>, libpython3-all-dev <!nopython>, python3-all-dev:any <!nopython>, python3-setuptools <!nopython>, python3:any <!nopython>
Package-List:
 brotli deb utils optional arch=any
 libbrotli-dev deb libdevel optional arch=any
 libbrotli1 deb libs optional arch=any
 python3-brotli deb python optional arch=any profile=!nopython
Checksums-Sha1:
 c1a06bd9cb912a8b5f07b2bd504af78ec6d0335c 512036 brotli_1.1.0.orig.tar.gz
 4cad3b75c791652657abb6ea166f1f8817afbb1a 5480 brotli_1.1.0-2.debian.tar.xz
Checksums-Sha256:
 10973f4b4199eafa1d5735ef661ddb2ec2f97319ee9fd1824d4aabe08cff5265 512036 brotli_1.1.0.orig.tar.gz
 3d913a3740bcad9a294007575a6beb1846beadbd62b44fb2bf9fdaeddea3236f 5480 brotli_1.1.0-2.debian.tar.xz
Files:
 97d4c95fcb7d5d6131c8d5a07eaa7d4b 512036 brotli_1.1.0.orig.tar.gz
 9eb311aaa7e3b17f900913645b43806d 5480 brotli_1.1.0-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCAAdFiEEkpeKbhleSSGCX3/w808JdE6fXdkFAmVfLIYACgkQ808JdE6f
XdngPRAAgZyP+VQL0QifdBKyQoI60X8Xh1RqsMtHeYPenz8pfdxwdnvWauA47EXc
lYjCiDk2VU2TSWT/KAI9q/oVf+gBwSJJ2XBg1mmvvOVgB/N1RQZTWd3SRzqo8Lbg
yu+iB5CACIuhsHtNGxWijRzOd0k4nAw/KUx744X2tXH+5N7j+91YlvGg3twdwPkW
RGQfS+5hsj2ja9VSGfhpHZ5RnvSyaGJQ7kF5t+zjFI0FMiu9YsbvjYCoVaTLyIU7
6InKu7m9hGBUsB6B89vZmpT4cQewfyOIHUpR2ndfjD+R5MC1lp0CnKzEqFhy6/lx
ksqm7YsjRUYG7LeZ7XYf83sDLDWB0gCtHB9Da1HhBEEN5G5bx5CCAGcqrhGrHU4V
JNB7CKTouqRZZgB2mYJgV330nEI2ONksk4lAdcNAixPoKjL2mu//tBUF7ihMWIuJ
IMxBDzErHCe3yyiP8Nc21KXz6OuTJm+cDq8N02oQMVJiF6hAGbeKhhY+iOWWnMYw
IrmEqkcladj+kctRzAXzTO7kAs1k2axwOvZrLw+yQkLqsETiZNsvRiCykj1meyuT
eUAfQIoVNQoyEtxRNHtlKZO7u6j8SwV4Iq54Cf+n9sRnNHGuY+Is7EpCpijETqx0
R/s++zE51OlDpQSpiF1qFGJQR3YRgDb2l7JdaeCYi7WCIG0jLbo=
=xegt
-----END PGP SIGNATURE-----
