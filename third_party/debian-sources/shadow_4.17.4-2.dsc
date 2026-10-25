-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: shadow
Binary: passwd, login.defs, uidmap, libsubid5, libsubid-dev
Architecture: any all
Version: 1:4.17.4-2
Maintainer: Shadow package maintainers <pkg-shadow-devel@lists.alioth.debian.org>
Uploaders:  Serge Hallyn <serge@hallyn.com>, Chris Hofstaedtler <zeha@debian.org>
Homepage: https://github.com/shadow-maint/shadow
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/shadow
Vcs-Git: https://salsa.debian.org/debian/shadow.git -b master
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, expect, procps
Build-Depends: bison, debhelper-compat (= 13), dh-package-notes, dh-sequence-zz-debputy-rrr (>= 0.1.23~), docbook-xml <!nodoc>, docbook-xsl <!nodoc>, gettext, itstool <!nodoc>, libacl1-dev, libattr1-dev, libaudit-dev [linux-any], libbsd-dev, libcrypt-dev, libltdl-dev, libpam0g-dev, libselinux1-dev [linux-any], libsemanage-dev [linux-any], libxml2-utils <!nodoc>, pkgconf, systemd-dev [linux-any], xsltproc <!nodoc>
Package-List:
 libsubid-dev deb libdevel optional arch=any
 libsubid5 deb libs optional arch=any
 login.defs deb admin required arch=all
 passwd deb admin required arch=any
 uidmap deb admin optional arch=any
Checksums-Sha1:
 6472ed66405924de1f564d0a18f01f12e5ce44d0 2326584 shadow_4.17.4.orig.tar.xz
 7bd20c7d3f803fa040e0778ff8fb01423b61fbdb 488 shadow_4.17.4.orig.tar.xz.asc
 995c806c27f295af2fc46c9b7b565ada9b6ce9e9 167792 shadow_4.17.4-2.debian.tar.xz
Checksums-Sha256:
 554801054694ff7d8a7abdf0d6ece34e2f16e111673cc01b8c9ee1278451181e 2326584 shadow_4.17.4.orig.tar.xz
 82437d2b54790b3a6734c526b757e693cd0c734ec6afd69f9a9cf0eb1dad8dc4 488 shadow_4.17.4.orig.tar.xz.asc
 97eaf0b3682a8a1a1ae6e4c4fac00885a7433d2487e636bde7c1c406e66bdb23 167792 shadow_4.17.4-2.debian.tar.xz
Files:
 469666ea82c203ce5b0116d26b3793a9 2326584 shadow_4.17.4.orig.tar.xz
 ac356bfd174072b7bee29779ec6357e9 488 shadow_4.17.4.orig.tar.xz.asc
 96a2386ac3834e9701651a95c36a5690 167792 shadow_4.17.4-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEfRrP+tnggGycTNOSXBPW25MFLgMFAmgDe74ACgkQXBPW25MF
LgMNRA//Zwm4mwkvLril63DFYu3CmlM1utnmVXDV6gJLTDmmUfgeqlp4TrGMSVyr
2RFMGAyi5+dO1z3ErYQHPN+tv5Ba/YKrOPNEpGnUfrMwbPy5u4lqpaBbuIPaUhkI
cE5CBtbRDb+48xcQFQNa2x25u6e1qKPqE1TCmHxKH0Jh27PlnB25ioSv8VWqpRtE
dnKQcXujsCN1aeSJsizESsKrrFKRQTsC2ZfOwXRVs0qyg4qkAw1Qzk+7WotWvYYL
kIPwDvyUH3HPhY7jqISF9TRg1LR1zgsaWer2+UYIC8RJXQqoxR2qzq7mHLFHgkMp
6jRk8ox2HvpYoW+dZjm/rwwCwWOG1iva6wACHqdmv5ort/DtLIsuhK4mzq26AERc
HjmckM8n8pNOlzwQeNQTnL1drFsY94dXoLbzD66g+3WrenPUtzZDyNVFHZf+cBhc
36ZiKXccr5bXJuf3N2iu1GeuECy/j/JSxqZgNyNd/nX+JrufQLPHJ6lK7c5NBI9j
M9Y5/fCMU0yULXexoDugQXdclc8P5f98MCTZLR5LuBpLedpqaZ+mOBtpf9OshfLq
GaHF0WkZIss3b3A3WQawdMMhdae4sAoNH+2LLWdkcysygn7Rxamy3aoMCCwLH8Nn
W7guHVSgSzkaZQknaVJ3xWSEmguhj7/xEiIsE1KoHlEkNqrgaew=
=Mkdm
-----END PGP SIGNATURE-----
