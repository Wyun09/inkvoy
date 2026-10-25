-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: krb5
Binary: krb5-user, krb5-kdc, krb5-kdc-ldap, krb5-admin-server, krb5-kpropd, krb5-multidev, libkrb5-dev, libkrb5-dbg, krb5-pkinit, krb5-otp, krb5-k5tls, krb5-doc, libkrb5-3, libgssapi-krb5-2, libgssrpc4t64, libkadm5srv-mit12, libkadm5clnt-mit12, libk5crypto3, libkdb5-10t64, libkrb5support0, libkrad0, krb5-gss-samples, krb5-locales, libkrad-dev
Architecture: any all
Version: 1.21.3-5+deb13u1
Maintainer: Sam Hartman <hartmans@debian.org>
Uploaders: Russ Allbery <rra@debian.org>, Benjamin Kaduk <kaduk@mit.edu>
Homepage: https://web.mit.edu/kerberos/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/krb5
Vcs-Git: https://salsa.debian.org/debian/krb5
Testsuite: autopkgtest
Testsuite-Triggers: ldap-utils, libsasl2-modules-gssapi-mit, slapd
Build-Depends: byacc | bison, comerr-dev, debhelper-compat (= 13), docbook-to-man, dpkg-dev (>= 1.22.5), libkeyutils-dev [linux-any], libldap2-dev <!stage1>, liblmdb-dev, libnss-myhostname, libsasl2-dev <!stage1>, libssl-dev, libverto-dev, pkgconf, ss-dev
Build-Depends-Arch: dpkg-dev (>= 1.22.5), keyutils [linux-any] <!nocheck>, libcmocka-dev <!nocheck>, python3-kdcproxy <!nocheck>, python3-pyrad <!nocheck>
Build-Depends-Indep: doxygen, doxygen-latex, python3, python3-cheetah, python3-lxml, python3-sphinx, tex-gyre
Package-List:
 krb5-admin-server deb net optional arch=any
 krb5-doc deb doc optional arch=all
 krb5-gss-samples deb net optional arch=any
 krb5-k5tls deb net optional arch=any
 krb5-kdc deb net optional arch=any
 krb5-kdc-ldap deb net optional arch=any profile=!stage1 profile:v1=!stage1
 krb5-kpropd deb net optional arch=any
 krb5-locales deb localization optional arch=all
 krb5-multidev deb libdevel optional arch=any
 krb5-otp deb net optional arch=any
 krb5-pkinit deb net optional arch=any
 krb5-user deb net optional arch=any
 libgssapi-krb5-2 deb libs optional arch=any
 libgssrpc4t64 deb libs optional arch=any
 libk5crypto3 deb libs optional arch=any
 libkadm5clnt-mit12 deb libs optional arch=any
 libkadm5srv-mit12 deb libs optional arch=any
 libkdb5-10t64 deb libs optional arch=any
 libkrad-dev deb libdevel optional arch=any
 libkrad0 deb libs optional arch=any
 libkrb5-3 deb libs optional arch=any
 libkrb5-dbg deb debug optional arch=any
 libkrb5-dev deb libdevel optional arch=any
 libkrb5support0 deb libs optional arch=any
Checksums-Sha1:
 3e383bbe88cbed56bdad4ba655c40abf0e961cf7 9136145 krb5_1.21.3.orig.tar.gz
 bba46878ffc67fcd96821cd7b8f451b5b1b2f475 833 krb5_1.21.3.orig.tar.gz.asc
 da5ad2ca88f2b585813f8f4bc1fa3fe8163aa1c3 105252 krb5_1.21.3-5+deb13u1.debian.tar.xz
Checksums-Sha256:
 b7a4cd5ead67fb08b980b21abd150ff7217e85ea320c9ed0c6dadd304840ad35 9136145 krb5_1.21.3.orig.tar.gz
 85047c935fe949ef2e275885451b168557b923dd13a5aab0ef8fe6acd27b94d7 833 krb5_1.21.3.orig.tar.gz.asc
 02b873b239fbe7ddf016dfe44deba4130673f4606c18c93da0622e2bc8500fb4 105252 krb5_1.21.3-5+deb13u1.debian.tar.xz
Files:
 beb34d1dfc72ba0571ce72bed03e06eb 9136145 krb5_1.21.3.orig.tar.gz
 cc604e5e51a7c3c314751c68c0cd5a09 833 krb5_1.21.3.orig.tar.gz.asc
 5946cd017e80e40a2584fcc9cba7cd64 105252 krb5_1.21.3-5+deb13u1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQKmBAEBCgCQFiEERkRAmAjBceBVMd3uBUy48xNDz0QFAmoAg69fFIAAAAAALgAo
aXNzdWVyLWZwckBub3RhdGlvbnMub3BlbnBncC5maWZ0aGhvcnNlbWFuLm5ldDQ2
NDQ0MDk4MDhDMTcxRTA1NTMxRERFRTA1NENCOEYzMTM0M0NGNDQSHGNhcm5pbEBk
ZWJpYW4ub3JnAAoJEAVMuPMTQ89EFaUQAIfgDqvxE5W7oLWzzUBy15awk0cn5Mmk
XTvrsm3dCM1zutv/vkVcAi+uM3kv7U1AO3wfs77WuJh7qCgCzBQl1RlOtUBA1io5
GeB8RZj2yAFmJQOGgykimsIsDUpPk8oDyyrfhHQl+6KsvVr78SciK/tHgs95SAUa
XN1NeXytbXTK6TGejbPDWHsQQq5X2Ge+EiWr9ah+SzB3OEuduDVELqZ3oNqnocg+
Wp0fG6b73OwCPS4+JKCaw27VbPTA+FhZmGLGLug/bc/44upwpSMFxuITkq5a/Omb
OL3pNl/RgNsYtIYjFFeJ5F6DIVzki+5XGdRSjh+LT9bbZ6yzBpiDSpnHnzLHlwkn
EdOwM0zEaQNHaQtPIY0dkwpcijdLhlmlzUQfgi8d/+5ygjeRHuhgrYWnxpeOeoPf
kp2jbNkG0EOY8ax1GX3pvsbpUQc+85IZovC/iMUAWfIHDSDU07YTUr7Pi8n2Njur
vtLK/iCJ4gREywZ5+eNjWKSKkPm7cbe1/LVB84wxY2aPj/Ot+nlIkwAYHZ+bhGgc
eKdDNFoHK3jntReqlg+M2U5wGzkisCxzY7qBiPrIMLus4dShWez9AMppbpnm6pjr
Hi8l0vz7d35ib/XCAmxaz/x83o9akfKYgqF8Yjw8b8Z0kWCX5Sh5HU9KIfpJN26G
v8DTsJ7SE8yd
=LNHy
-----END PGP SIGNATURE-----
