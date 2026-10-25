-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: cyrus-sasl2
Binary: sasl2-bin, cyrus-sasl2-doc, libsasl2-2, libsasl2-modules, libsasl2-modules-db, libsasl2-modules-ldap, libsasl2-modules-otp, libsasl2-modules-sql, libsasl2-modules-gssapi-mit, libsasl2-dev, libsasl2-modules-gssapi-heimdal
Architecture: any all
Version: 2.1.28+dfsg1-9
Maintainer: Debian Cyrus Team <team+cyrus@tracker.debian.org>
Uploaders: Ondřej Surý <ondrej@debian.org>,
Homepage: https://www.cyrusimap.org/sasl/
Standards-Version: 4.3.0.1
Vcs-Browser: https://salsa.debian.org/debian/cyrus-sasl2
Vcs-Git: https://salsa.debian.org/debian/cyrus-sasl2.git
Testsuite: autopkgtest
Testsuite-Triggers: krb5-admin-server, krb5-kdc, krb5-user, ldap-utils, slapd
Build-Depends: debhelper-compat (= 12), libpod-pom-view-restructured-perl:native <!nodoc>
Build-Depends-Arch: chrpath, default-libmysqlclient-dev <!pkg.cyrus-sasl2.nosql>, docbook-to-man, groff-base, heimdal-multidev <!pkg.cyrus-sasl2.nogssapi>, krb5-multidev <!pkg.cyrus-sasl2.nogssapi>, libdb-dev, libcrypt-dev, libkrb5-dev <!pkg.cyrus-sasl2.nogssapi>, libldap2-dev <!pkg.cyrus-sasl2.noldap>, libpam0g-dev, libpq-dev <!pkg.cyrus-sasl2.nosql>, libsqlite3-dev, libssl-dev, po-debconf, python3-sphinx <!nodoc>
Build-Depends-Indep: python3-sphinx-rtd-theme
Build-Conflicts: heimdal-dev
Package-List:
 cyrus-sasl2-doc deb doc optional arch=all profile=!nodoc
 libsasl2-2 deb libs optional arch=any
 libsasl2-dev deb libdevel optional arch=any
 libsasl2-modules deb libs optional arch=any
 libsasl2-modules-db deb libs optional arch=any
 libsasl2-modules-gssapi-heimdal deb libs optional arch=any profile=!pkg.cyrus-sasl2.nogssapi
 libsasl2-modules-gssapi-mit deb libs optional arch=any profile=!pkg.cyrus-sasl2.nogssapi
 libsasl2-modules-ldap deb libs optional arch=any profile=!pkg.cyrus-sasl2.noldap
 libsasl2-modules-otp deb libs optional arch=any
 libsasl2-modules-sql deb libs optional arch=any profile=!pkg.cyrus-sasl2.nosql
 sasl2-bin deb utils optional arch=any
Checksums-Sha1:
 297ba17d605b880a9a9beb8b08abc0cf90945c40 794540 cyrus-sasl2_2.1.28+dfsg1.orig.tar.xz
 86f90d7e834a9c0084ab3f10746c284f9e741d35 99180 cyrus-sasl2_2.1.28+dfsg1-9.debian.tar.xz
Checksums-Sha256:
 e796a5d85d1a85e1b433d43504e467f9075c7ebc0b45730a3996cf11b1deada4 794540 cyrus-sasl2_2.1.28+dfsg1.orig.tar.xz
 8215afa01ee2907da0a650bfa6b9cf0fae12f2611a098eedd853b5e71adf6623 99180 cyrus-sasl2_2.1.28+dfsg1-9.debian.tar.xz
Files:
 3ab6f193b23938524b51706616d38ad1 794540 cyrus-sasl2_2.1.28+dfsg1.orig.tar.xz
 33887e6c5636e15273a39359bc57ae44 99180 cyrus-sasl2_2.1.28+dfsg1-9.debian.tar.xz


-----BEGIN PGP SIGNATURE-----

iQHEBAEBCgAuFiEEQGIgyLhVKAI3jM5BH1x6i0VWQxQFAmfCN0cQHGJhZ2VAZGVi
aWFuLm9yZwAKCRAfXHqLRVZDFOw+C/4ssvwqiXBMi1Nga9I/1Ql8JZ4nSHl66iq1
dNNO+W2yL0laJgrFIXdh6Oia36mjT0Ks12/EFVrS2TyO4Kor5JpCFfY8QuOGmL5H
5xgd+Znih8xzKikZtxx+Mu7wMtAbRbfgBjVqDPRIhxy8PgD3hLebgufcTKhQrVvi
0GABTZHyx6FndjrQvyorR9MHbspedUbvoz44eVmeLYu5IwzPzHrzG69Xe9x3HRH5
NG3ArUW0aQSTJjOIeuM31fd4PFZYCgE9+p7LGg0ma0EYFr6uRIYc6XzHrfcJ/IEE
RLZ4OWPVgP/AKlpfPmM6pa1+CYX/HtIoyVlDSiBWEJbclHXxN1A4nsOr4SzWEmt+
EbkHHD7Ak3a51gBpqZz4Rknc8PbM5IegDN3fh1n2S9Gp+uNTlQGoriSeeRU1pPoT
hPBIApbTHs1rPF9EZ9scc3egoBP7f/PtYO7KLd85xsTGE9bO9FVJx1pkVLr1Usyg
F4Cyu5jW7fXRD0G7ACJENS8DLlaqwwg=
=90sM
-----END PGP SIGNATURE-----
