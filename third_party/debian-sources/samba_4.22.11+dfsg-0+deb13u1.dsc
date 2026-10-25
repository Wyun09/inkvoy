-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: samba
Binary: samba, samba-libs, samba-common, samba-common-bin, samba-ad-dc, samba-ad-provision, smbclient, samba-testsuite, registry-tools, samba-dev, python3-samba, samba-dsdb-modules, samba-vfs-modules, samba-vfs-ceph, samba-vfs-glusterfs, libsmbclient0, libsmbclient, libsmbclient-dev, winbind, libpam-winbind, libnss-winbind, libwbclient0, libwbclient-dev, ctdb, libldb2, ldb-tools, libldb-dev, python3-ldb, libtalloc2, libtalloc-dev, python3-talloc, libtevent0t64, libtevent0, libtevent-dev, libtdb1, tdb-tools, libtdb-dev, python3-tdb
Architecture: any all
Version: 2:4.22.11+dfsg-0+deb13u1
Maintainer: Debian Samba Maintainers <pkg-samba-maint@lists.alioth.debian.org>
Uploaders: Jelmer Vernooĳ <jelmer@debian.org>, Mathieu Parent <sathieu@debian.org>, Michael Tokarev <mjt@tls.msk.ru>
Homepage: https://www.samba.org
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/samba-team/samba
Vcs-Git: https://salsa.debian.org/samba-team/samba.git
Testsuite: autopkgtest
Testsuite-Triggers: cifs-utils, coreutils, passwd, systemd
Build-Depends: debhelper-compat (= 13), dh-exec
Build-Depends-Arch: dh-sequence-python3, python3-setuptools, dpkg-dev (>= 1.22.5) <!pkg.samba.before-trixie>, bison, docbook-xml, docbook-xsl, xsltproc, flex, perl:any, libparse-yapp-perl:native | libparse-yapp-perl, rpcsvc-proto <!pkg.samba.before-trixie>, gcc-mingw-w64-i686-win32, gcc-mingw-w64-x86-64-win32, pkgconf, libacl1-dev, libarchive-dev, libavahi-client-dev, libavahi-common-dev, libblkid-dev, libbsd-dev, libcap-dev [linux-any], libcephfs-dev [amd64 arm64 mips64el ppc64el riscv64 s390x], librados-dev [amd64 arm64 mips64el ppc64el riscv64 s390x], libcmocka-dev, libcrypt-dev, libcups2-dev, libdbus-1-dev, libglusterfs-dev [amd64 arm64 loong64 mips64el ppc64 ppc64el riscv64 s390x sparc64], libgnutls28-dev, libgpgme11-dev, libicu-dev, libjansson-dev, libkeyutils-dev [linux-any], libkrb5-dev (>= 1.21.0~) <pkg.samba.mitkrb5>, libldap2-dev, liblmdb-dev, libpam0g-dev, libpcap-dev [hurd-any], libpopt-dev, libreadline-dev, libtirpc-dev, libsystemd-dev [linux-any], libtasn1-6-dev, libtasn1-bin, liburing-dev [linux-any], xfslibs-dev:native [linux-any], zlib1g-dev, python3-dev:native, libpython3-dev, python3-dnspython:native | python3-dnspython, python3-etcd:native | python3-etcd, python3-markdown:native | python3-markdown
Package-List:
 ctdb deb net optional arch=any
 ldb-tools deb utils optional arch=any
 libldb-dev deb libdevel optional arch=any
 libldb2 deb libs optional arch=any
 libnss-winbind deb admin optional arch=any
 libpam-winbind deb admin optional arch=any
 libsmbclient deb libs optional arch=any profile=pkg.samba.before-trixie
 libsmbclient-dev deb libdevel optional arch=any
 libsmbclient0 deb libs optional arch=any profile=!pkg.samba.before-trixie
 libtalloc-dev deb libdevel optional arch=any
 libtalloc2 deb libs optional arch=any
 libtdb-dev deb libdevel optional arch=any
 libtdb1 deb libs optional arch=any
 libtevent-dev deb libdevel optional arch=any
 libtevent0 deb libs optional arch=any profile=pkg.samba.before-trixie
 libtevent0t64 deb libs optional arch=any profile=!pkg.samba.before-trixie
 libwbclient-dev deb libdevel optional arch=any
 libwbclient0 deb libs optional arch=any
 python3-ldb deb python optional arch=any
 python3-samba deb python optional arch=any
 python3-talloc deb python optional arch=any
 python3-tdb deb python optional arch=any
 registry-tools deb net optional arch=any
 samba deb net optional arch=any
 samba-ad-dc deb net optional arch=any
 samba-ad-provision deb net optional arch=all
 samba-common deb net optional arch=all
 samba-common-bin deb net optional arch=any
 samba-dev deb devel optional arch=any
 samba-dsdb-modules deb libs optional arch=any
 samba-libs deb libs optional arch=any
 samba-testsuite deb net optional arch=any
 samba-vfs-ceph deb net optional arch=amd64,arm64,mips64el,ppc64el,riscv64,s390x
 samba-vfs-glusterfs deb net optional arch=amd64,arm64,loong64,mips64el,ppc64,ppc64el,riscv64,s390x,sparc64
 samba-vfs-modules deb oldlibs optional arch=any
 smbclient deb net optional arch=any
 tdb-tools deb utils optional arch=any
 winbind deb net optional arch=any
Checksums-Sha1:
 8e9df9ed3472a7f90e975f64a1be0c5c8151e02b 25620416 samba_4.22.11+dfsg.orig.tar.xz
 bca7208ce4b02fcae551ad094f8ee77f53bd2bf6 189836 samba_4.22.11+dfsg-0+deb13u1.debian.tar.xz
Checksums-Sha256:
 4379aa4bc6c453bfa55697556d6195ab69b1cad71e5fdfaf2c53849d96d40f0a 25620416 samba_4.22.11+dfsg.orig.tar.xz
 0359a3242bcbd14f74994a195084f7a8ea28bf9d1287c0021921c40b7d5d7a03 189836 samba_4.22.11+dfsg-0+deb13u1.debian.tar.xz
Files:
 f783eb02feca352b8c5bb263b68bfb8d 25620416 samba_4.22.11+dfsg.orig.tar.xz
 75308d8a83a57b5c688607817cec731c 189836 samba_4.22.11+dfsg-0+deb13u1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEZKoqtTHVaQM2a/75gqpKJDselHgFAmponM0ACgkQgqpKJDse
lHhraBAAwcPs2z2/uOOtTawaINR2uuQMdZ4X8Q9u8XvD7GbFaic509NnxbgVzm6p
KRdMc1uIfI3lPnAVk3C9w8teLGlzPsqZm/4fxLukBWPsl55DCJOmhmNGqKp+AmM7
MCVwS/LTDZm0Ph4eDss5aGjkUhidsJHuCglSe8wyCv18UEMHzzcMeg0nh0ubZDXb
dTRbvXiMbwYU+y71LR14/l7ShP7vFobHIHjAb+jgC+SQ5lNORikCYWhIZckjwBzp
+iyFAjCnA9I8SMc9wf+ARAM6hAPBjpriZpZcRMLiZTqh9gvOweEjJYrfl3LNjCZo
ARobPJrGEBN17P2Fy/oyvGzwnznoAhGM/nhB0DXGp5Wc5/Wfn7ju4JvjpUe9HAYp
aEOY3rEo4vMMiG3GNQ3pI6X+IkqVnJpp80ojkAVd9BqX+mvFq+l8LEr2BU8pbXmr
sSLNI1uFz7lSsS/mx/cVuRpcfm0nmxyZ5DXEoECS/78lBrqPB3pllUrM/CJM5Gf2
CRkYJhBMYBEdHTaF6kTLNt5gMl4ipLKQYEOMTdpiLsZ9M+MWAg77S1CIB2Qs+/OK
ztrEOCdorIgWkxGCa5SSkCyqAnLN3HAflJ/CNGBErZlG4VZjFc+WUeiERlg+8Q+/
qpyo0BsWe2qj6RSIPNrD52zahtaVnmA1VmKuHbAXLMqavKwEbmg=
=tyGy
-----END PGP SIGNATURE-----
