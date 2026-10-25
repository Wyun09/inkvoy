-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: nghttp2
Binary: libnghttp2-dev, libnghttp2-doc, libnghttp2-14, nghttp2-client, nghttp2-proxy, nghttp2-server, nghttp2
Architecture: any all
Version: 1.64.0-1.1+deb13u1
Maintainer: Tomasz Buchert <tomasz@debian.org>
Uploaders: Ondřej Surý <ondrej@debian.org>
Homepage: https://nghttp2.org/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/nghttp2
Vcs-Git: https://salsa.debian.org/debian/nghttp2.git
Testsuite: autopkgtest
Testsuite-Triggers: nginx
Build-Depends: debhelper (>= 13), debhelper-compat (= 13), libc-ares-dev, libcunit1-dev <!nocheck>, libev-dev, libjansson-dev, libjemalloc-dev [!hurd-i386], libssl-dev, libsystemd-dev, libxml2-dev, pkgconf, zlib1g-dev
Build-Depends-Indep: python3-sphinx, python3-sphinx-rtd-theme
Package-List:
 libnghttp2-14 deb libs optional arch=any
 libnghttp2-dev deb libdevel optional arch=any
 libnghttp2-doc deb doc optional arch=all
 nghttp2 deb httpd optional arch=all
 nghttp2-client deb httpd optional arch=any
 nghttp2-proxy deb httpd optional arch=any
 nghttp2-server deb httpd optional arch=any
Checksums-Sha1:
 422ab3102d4d22ff363fbababe9f66e2ae38db45 1069782 nghttp2_1.64.0.orig.tar.gz
 3edbadb61b38b529ba29b86c566523d8f778c36d 42120 nghttp2_1.64.0-1.1+deb13u1.debian.tar.xz
Checksums-Sha256:
 b452dc69a1fcbc9375389b8b154175d8b7b125cdd713fc426774c2b79a1ebd77 1069782 nghttp2_1.64.0.orig.tar.gz
 e16478701c5c007aa8761dc30c01090b2217199558bd1017b1d237db463d758c 42120 nghttp2_1.64.0-1.1+deb13u1.debian.tar.xz
Files:
 a4c2bb361820eedd872af2a4192070b7 1069782 nghttp2_1.64.0.orig.tar.gz
 d3feb46ee34764f33cda071b42ba46f0 42120 nghttp2_1.64.0-1.1+deb13u1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQEzBAEBCgAdFiEExq6D0hxncEPaPayX+GQ1dHE8m64FAmoEZCgACgkQ+GQ1dHE8
m67z0wgA2Jj2IiKhVHH5kkBH6J0+HKUgra/TTGc7mo7ZrgQLzdEgKdgD75Zxwc8P
Nhv+isTXMmeEIP1xRaRrF3l5gADumbXIvYFWsj0fnvrGbuw3eywFRJnDl8e+ysOX
az9646qGL9Ab4vFYln94B9VvAo1Vi4N0ATjsNEEifO1zbbWR1dG7oVy5C2iEs4on
ozY2uGBCd5c0f1zAGEpt8vQw/KzWWeSDBJlWCV5nQyIzewLUpm9dAlYE+fNdi2+v
1J7BIb25cUxQEkyUudYftO+zh5o0JJ6vKmk4Pt9zWaSmx+i+EAmzXDIM4fv6v7DO
FebcYEn0tTSvgjdz5ZKhrnv8e84mtQ==
=UHnj
-----END PGP SIGNATURE-----
