-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: make-dfsg
Binary: make, make-guile
Architecture: any
Version: 4.4.1-2
Maintainer: Stephen Kitt <skitt@debian.org>
Homepage: https://www.gnu.org/software/make/
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/debian/make
Vcs-Git: https://salsa.debian.org/debian/make.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@
Build-Depends: debhelper-compat (= 13), guile-3.0-dev <!noguile>, pkgconf
Package-List:
 make deb devel optional arch=any
 make-guile deb devel optional arch=any profile=!noguile
Checksums-Sha1:
 5168d9098a29e7507551203bbc30894420ec9869 1125180 make-dfsg_4.4.1.orig.tar.xz
 8b6ab410368ad97ea67a3680fda686b114ab5a63 44088 make-dfsg_4.4.1-2.debian.tar.xz
Checksums-Sha256:
 3b16b00ea1079af9f8096bbc71ff7cc00c249fc6a862003da3c42308a0adb0fe 1125180 make-dfsg_4.4.1.orig.tar.xz
 c785b80bd83b8294f104da43aee9573ba3e175e2e9a77ac00a49f0a569d6e061 44088 make-dfsg_4.4.1-2.debian.tar.xz
Files:
 bd15c4e6c9deedcba9cffa6ee8cad540 1125180 make-dfsg_4.4.1.orig.tar.xz
 6741fe0714ddce981d7c1c23a5068b06 44088 make-dfsg_4.4.1-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEnPVX/hPLkMoq7x0ggNMC9Yhtg5wFAmfyeyoACgkQgNMC9Yht
g5yocg/+PNYuYb6vYnTdgYYTLj9I6P2kHk6sp7CqfZKcrh6qtkcMmJAJavLZp3vL
A7Q0JST7wVfitRsY5gvbs+KJGJqMW/eM2zpa7Ldn4y8HfzSe5zeItp+9os1E0yhs
ebouVyr29szJAuafzMkdbwW3P5WLkIaQqYYTCuz7hKu39fJ7V3wQdVuStYA5VdKx
/63YL95v3riOVcp4TJbzqDunW7ufcbYBSnybu5+QbR/suWjp1yFmehUnMVta0Ar7
T0kKwKqLGpbEGbq6GR3fuWLjZIsp4K8i7G/MPqCf2Fgk7uDDZrRgxwv7dWuXThOW
f1yfWeCxOyZL3g9tokr/qTfOBMxVnAWjfs1Vm9UxTLIQHCiw1ynkqsrqIk/Si2a1
seZFAH96NSd6xrfqavCCbTK6zXlKJ5DkxPIjyoNUx/7n6UgQx2TkRTByhL0WEJ34
c5EaoZdeyo9xxnKlxwYW7CXiWERrRq8quyD/B9C6BCmM4teXwgZpGlm24Y40YRvH
DKf3E+ZU0H/fQux68xiGKb8mbzB8XeKr0rRdAJxqAcJ4u4Mh0IJ8Aj5yHL1Gmn3W
fBIBI8ZHbqnOg1fY+0qt4cpYLTXQTklz/rKAWAUFRZqqbmuX8UrlwQvuGo5WOQmE
38jZxGXWaKmv9abZr2hN15/nlNAXEc13adtcXZ82IkpOYpHRFzU=
=qM+3
-----END PGP SIGNATURE-----
