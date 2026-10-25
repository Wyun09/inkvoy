-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: openldap
Binary: slapd, slapd-contrib, ldap-utils, libldap2, libldap-common, libldap-dev, libldap2-dev, slapi-dev
Architecture: any all
Version: 2.6.10+dfsg-1
Maintainer: Debian OpenLDAP Maintainers <pkg-openldap-devel@lists.alioth.debian.org>
Uploaders: Ryan Tandy <ryan@nardis.ca>, Sergio Durigan Junior <sergiodj@debian.org>, Michael Tokarev <mjt@tls.msk.ru>
Homepage: https://www.openldap.org/
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/openldap-team/openldap
Vcs-Git: https://salsa.debian.org/openldap-team/openldap.git
Testsuite: autopkgtest
Testsuite-Triggers: heimdal-kdc, openssl, samba, schema2ldif, ssl-cert
Build-Depends: debhelper-compat (= 13), groff-base, heimdal-multidev <!pkg.openldap.noslapd>, libargon2-dev <!pkg.openldap.noslapd>, libcrack2-dev <!pkg.openldap.noslapd>, libltdl-dev <!pkg.openldap.noslapd>, libperl-dev <!pkg.openldap.noslapd>, libsasl2-dev, libssl-dev, libwrap0-dev <!pkg.openldap.noslapd>, openssl <!nocheck !pkg.openldap.noslapd>, perl:any, pkgconf, po-debconf, unixodbc-dev <!pkg.openldap.noslapd>, krb5-admin-server <!nocheck !pkg.openldap.noslapd>, krb5-user <!nocheck !pkg.openldap.noslapd>, krb5-kdc <!nocheck !pkg.openldap.noslapd>, libsasl2-modules-gssapi-mit <!nocheck !pkg.openldap.noslapd>, sasl2-bin <!nocheck !pkg.openldap.noslapd>
Build-Conflicts: autoconf2.13, libbind-dev
Package-List:
 ldap-utils deb net optional arch=any
 libldap-common deb libs optional arch=all
 libldap-dev deb libdevel optional arch=any
 libldap2 deb libs optional arch=any
 libldap2-dev deb oldlibs optional arch=all
 slapd deb net optional arch=any profile=!pkg.openldap.noslapd
 slapd-contrib deb net optional arch=any profile=!pkg.openldap.noslapd
 slapi-dev deb libdevel optional arch=any profile=!pkg.openldap.noslapd
Checksums-Sha1:
 fedb1576cd4dcfe9838d6ac4b00592698a97b086 3754560 openldap_2.6.10+dfsg.orig.tar.xz
 15c0b615a0d3c06e26ea75e80b68f2203d69bba2 170112 openldap_2.6.10+dfsg-1.debian.tar.xz
Checksums-Sha256:
 e871102bda1e42155fd4d6be4825a297e1c593cb0907b84fc7dde888dc847877 3754560 openldap_2.6.10+dfsg.orig.tar.xz
 2dc95ade5655d67c9043e45b5601734fdb7f668267682d087b595a80de24a500 170112 openldap_2.6.10+dfsg-1.debian.tar.xz
Files:
 4cd7308803ad2c7eb3168be97e76ccf6 3754560 openldap_2.6.10+dfsg.orig.tar.xz
 bc396139149a8fe68f7d853ee12c94a5 170112 openldap_2.6.10+dfsg-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQJDBAEBCgAtFiEEPSfh0nqdQTd5kOFlIp/PEvXWa7YFAmg5B3EPHHJ5YW5AbmFy
ZGlzLmNhAAoJECKfzxL11mu2OQgP/Asp5j5+QAhWYn/mhqnLWghcuxDrqCZGuzp/
Mb2LO4aDgyPJfLJfQh7f1p1JtXKzkRWkU/avaSAq05ISNh7h2Vs8Zb0EfGxPoZLU
6+QEm39iVMpPwceOef9UR9P3iVH6NG7umIjfEnd+PHN3O1W8+c1mxvuORjUYDC9Q
J+xqLtebmH3SU7JJRTV6YA/R+wXlWkk6+PDvZ6X3DgI1UtqkoE021x6ecabY93SU
HZBBAr4LUzH95KMbPYaLa5QFWyyNWHj539KdKxApPzV30Gg0escvBzPznLt0m2Zc
Cmfcr+NW0DiyHwnt/InueqpdjwH7TBZpi7g8HM2OimIpUSDc+6WJQO7L0rIkpa0b
G4CJIYOX9iHmAtSamoDEqBNMcDfOLDQyYND35/TDP8GpuVrNZDu/CCynqzxKcFAI
Zw7POYO8sqm1xRIK+nawfb4q1jPm3iuG0dh1kEWgcRmVD5MpiWiawz258/Hbcrf4
Ak5wsM25Kd3WO/P9MsVlCiIercP48NlnS3gGWXaQFqUsah7cfPuXuvbVmKa8TkrE
iQZ4EXlNRjAy5mRan9EEwVUNnB5ek/ceV19n9ByfWqYjDXc1aEgxbk2oxj2iva6Y
ic/irCnsFRLORwfIPJ8r0Tz2/3TuY84OkrbFpv7hFhdDZe4IBpSULcujpnpOe332
Iws2Z/+Q
=pgu1
-----END PGP SIGNATURE-----
