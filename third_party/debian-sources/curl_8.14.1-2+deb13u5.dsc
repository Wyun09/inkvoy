-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: curl
Binary: curl, libcurl4t64, libcurl3t64-gnutls, libcurl4-openssl-dev, libcurl4-gnutls-dev, libcurl4-doc
Architecture: any all
Version: 8.14.1-2+deb13u5
Maintainer: Debian Curl Maintainers <team+curl@tracker.debian.org>
Uploaders: Carlos Henrique Lima Melara <charlesmelara@riseup.net>, Samuel Henrique <samueloph@debian.org>, Sergio Durigan Junior <sergiodj@debian.org>
Homepage: https://curl.se/
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/debian/curl
Vcs-Git: https://salsa.debian.org/debian/curl.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, build-essential, gcc, libc-dev, libcurl-dev, libldap-dev, pkgconf, slapd
Build-Depends: dpkg-dev (>= 1.22.5), debhelper-compat (= 13), autoconf, automake, ca-certificates, groff-base, libbrotli-dev, libgnutls28-dev, libidn2-dev, libkrb5-dev, libldap2-dev <!pkg.curl.noldap>, libnghttp2-dev, libpsl-dev, librtmp-dev, libssh2-1-dev, libssl-dev, libtool, libzstd-dev, locales-all <!nocheck>, libngtcp2-dev (>= 1.2.0), libngtcp2-crypto-gnutls-dev (>= 1.2.0), libnghttp3-dev (>= 1.1.0), openssh-server <!nocheck>, python3:native <!nocheck>, python3-impacket [!alpha !hppa !m68k !sh4] <!nocheck>, gnutls-bin [!ppc64el] <!nocheck>, quilt, stunnel4 <!nocheck>, zlib1g-dev
Build-Conflicts: autoconf2.13, automake1.4
Package-List:
 curl deb web optional arch=any
 libcurl3t64-gnutls deb libs optional arch=any
 libcurl4-doc deb doc optional arch=all
 libcurl4-gnutls-dev deb libdevel optional arch=any
 libcurl4-openssl-dev deb libdevel optional arch=any
 libcurl4t64 deb libs optional arch=any
Checksums-Sha1:
 d84a4b8baf1baaca33e31e809f5e770deb727c2f 4250332 curl_8.14.1.orig.tar.gz
 c892a3257a40081f754b33e6a10eca2453860307 488 curl_8.14.1.orig.tar.gz.asc
 9708df4a0ed6fd56339c4152252e7ad2d26126e3 72312 curl_8.14.1-2+deb13u5.debian.tar.xz
Checksums-Sha256:
 6766ada7101d292b42b8b15681120acd68effa4a9660935853cf6d61f0d984d4 4250332 curl_8.14.1.orig.tar.gz
 39cc2ec8ddc39d04e3e7101bbed46d858d0875cbb297a6bfa20959fa2bc7d5c7 488 curl_8.14.1.orig.tar.gz.asc
 ebdfcfab1c2001c7a539fe2a4044dbf666a544393f191bedce9ee2d07c4ea925 72312 curl_8.14.1-2+deb13u5.debian.tar.xz
Files:
 745dfc1da8c44eb9ce6ede16fd102c32 4250332 curl_8.14.1.orig.tar.gz
 e90da3c198bfec67be08392e2a974103 488 curl_8.14.1.orig.tar.gz.asc
 7372cbf30b98b036c5e37828552f9b6c 72312 curl_8.14.1-2+deb13u5.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEBdtqg34QX0sdAsVfu6n6rcz7RwcFAmpUUCgACgkQu6n6rcz7
RweK+A/+KUFyCBHPjhdgicIZg+n+F70mjlf34lPtR10nikMvyIPqMUK8dY4s2tj1
MIANAXXf1oROPqiKjzDpYB9GNJ5PDEupYHuB+JtwB9TL5WV3/n93DKxBkhbg+k4w
4q9F589ohw0MTI9kwj3CHbX4msFrG1fEmpDdk78PZf2SBqZ1OU81pZyEYpnKqI5Z
wT3/lZ/vE6UrEOOr2L2WoL2CUm6iPBYKZakGdqoRtiTckDDKiRopp3YClmW/JXZU
R9vyPhA0q4ZzzdM7CpWKOAbbLivyHNlHZKr8nrw7RxIKzLqVupYEX7cFQPESkp8k
8HVGAI3eloRAItM1z1IOsFzSe+GHQEq/0EHAExcK9G0bdkhFZvIi5My3VmKxb5Y+
vw8E0PjPTR8p4XTvBL1C4pkHxvz/W6eG0GNdJa1qgYWs+UEC/2bWTDeLS0JVbSBO
A3c4h7Hb6KP27dSfCxJpdZlwdUxQ0iryUjhXafWqcZ9R08DGrEK6PJI9382nZnZx
ShOI96+5dk3KT2I2TueIGp2BOdC3BddIWSB73sSZHL/FV2R4oD/mcXi1Rv8Z2Ryt
QGjwNEV58WfpNB0JONGvBoQ2QvHDISEJDmfHBwHBpKXALCUtgwNUnx2jWq3pEqJL
xBbC8Ba5zKNi5XVxITVDb0SUvZU/3jI72e3YIGjT7I0qX5w5f0Q=
=8Auk
-----END PGP SIGNATURE-----
