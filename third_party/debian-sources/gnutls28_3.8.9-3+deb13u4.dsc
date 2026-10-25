-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: gnutls28
Binary: libgnutls28-dev, libgnutls30t64, gnutls-bin, gnutls-doc, libgnutls-openssl27t64, libgnutls-dane0t64
Architecture: any all
Version: 3.8.9-3+deb13u4
Maintainer: Debian GnuTLS Maintainers <pkg-gnutls-maint@lists.alioth.debian.org>
Uploaders:  Andreas Metzler <ametzler@debian.org>, Eric Dorland <eric@debian.org>, James Westby <jw+debian@jameswestby.net>, Simon Josefsson <simon@josefsson.org>,
Homepage: https://www.gnutls.org/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/gnutls-team/gnutls
Vcs-Git: https://salsa.debian.org/gnutls-team/gnutls.git
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, ca-certificates, freebsd-net-tools, net-tools, openssl, softhsm2
Build-Depends: dpkg-dev (>= 1.22.5), bison, ca-certificates <!nocheck>, chrpath, debhelper-compat (= 13), freebsd-net-tools [kfreebsd-i386 kfreebsd-amd64] <!nocheck>, gperf, libcmocka-dev <!nocheck>, libidn2-dev, libp11-kit-dev, libssl-dev <!nocheck>, libtasn1-6-dev, libunbound-dev, libunistring-dev, net-tools [!kfreebsd-i386 !kfreebsd-amd64] <!nocheck>, nettle-dev (>= 3.10), openssl <!nocheck>, pkgconf, python3:any, softhsm2 <!nocheck>
Build-Depends-Indep: gtk-doc-tools, texinfo, texlive-latex-base, texlive-plain-generic
Build-Conflicts: libgnutls-dev
Package-List:
 gnutls-bin deb net optional arch=any
 gnutls-doc deb doc optional arch=all
 libgnutls-dane0t64 deb libs optional arch=any
 libgnutls-openssl27t64 deb libs optional arch=any
 libgnutls28-dev deb libdevel optional arch=any
 libgnutls30t64 deb libs optional arch=any
Checksums-Sha1:
 4bacfbfcba06b67e91bbd3535c275b04ef89a61f 6847364 gnutls28_3.8.9.orig.tar.xz
 2d96a7aa8a204014dc40b14030b9120edad27174 833 gnutls28_3.8.9.orig.tar.xz.asc
 64963c11663d6384123657509dbaa0556e6122c7 140880 gnutls28_3.8.9-3+deb13u4.debian.tar.xz
Checksums-Sha256:
 69e113d802d1670c4d5ac1b99040b1f2d5c7c05daec5003813c049b5184820ed 6847364 gnutls28_3.8.9.orig.tar.xz
 7631d47762865d4ef494492cca794cf0fe6a8be892a4aa02f362ae29006d3054 833 gnutls28_3.8.9.orig.tar.xz.asc
 f0b9c7d182072f0bbdb281304686aa6e2bfd343dadefa432ec4dab4893e9841f 140880 gnutls28_3.8.9-3+deb13u4.debian.tar.xz
Files:
 33f4c800c20af2983c45223a803da865 6847364 gnutls28_3.8.9.orig.tar.xz
 70e70e5e8822e3649e5e07e3cb87c5cd 833 gnutls28_3.8.9.orig.tar.xz.asc
 38f664bc59e3bb4ad032ed55b09c6b97 140880 gnutls28_3.8.9-3+deb13u4.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEE0uCSA5741Jbt9PpepU8BhUOCFIQFAmoAcc0ACgkQpU8BhUOC
FISEJhAAmkBh36LnzsUZGSdhmO/ULClzHB2F3asvdoHzYvxCF5PVPgzTwTRdoBLO
5vJ8w/bys7nraza5L19ONWnU7EVW8M2RkFwAm9O7bHnP+oMBpbIR5qYln11LmKNy
187XPV89TQPE18RRqB28xP+y6NmtlT1tp6Hj0PSP7y3v1QKdA/8m7V6vdM2R/uCi
DQ1aGPb948Fc1MiW/92ezK68xAf+jg0alRhHZB0KcU2Lf1a8hZXk4PbYjYBJUial
tHxX/9fw+l7NsCy0lCksk3CdgbtbIkbL/kz/D2vksG8dqn6SlLKKEeKsy4HOg+p9
Sbq7R9U954gHi7LyGO1gxoRsA+q7J+UZMwjX1FBPc45GE1tIorMKDejUloVVCvW+
XrxNXXhG3ywuLcMkWDhtJOtiuGD4/2wFeBX9veCNJlOLIc2KbzaTmxA8k2qRk2kl
VNeK3Xkgtb5LFI69vC92IIv77gFqfVB0au/3RbZlr+2e02j9c2WUX1S2wi15Aiwg
A5MK4Q/k2rpY0IinEG3EqQHgilpKHr7x/ADzbv1H8qd+T29NT5lP+ipIpyrWrDA5
mT8u40XaO4Y5cfnxYyy2klQP/mgM57TFjF+obShHvCirAPpXgO0egJXECuAGgj92
VUbDLFoNiMsCd1gf53RftW/i1hDbR3iV6lYXOmsFhCRjfE19ZfY=
=0Mq4
-----END PGP SIGNATURE-----
