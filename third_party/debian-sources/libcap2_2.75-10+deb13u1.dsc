-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: libcap2
Binary: libcap2-bin, libcap2, libcap-dev, libpam-cap, libcap2-udeb, golang-kernel-pub-linux-libs-security-libcap-dev
Architecture: linux-any all
Version: 1:2.75-10+deb13u1
Maintainer: Christian Kastner <ckk@debian.org>
Homepage: https://sites.google.com/site/fullycapable/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/libcap2
Vcs-Git: https://salsa.debian.org/debian/libcap2.git
Testsuite: autopkgtest
Testsuite-Triggers: gcc, libc-dev
Build-Depends: patchelf, debhelper-compat (= 13), gperf (>= 3.1), indent, libpam0g-dev
Build-Depends-Indep: dh-golang, golang-any
Package-List:
 golang-kernel-pub-linux-libs-security-libcap-dev deb libs optional arch=all
 libcap-dev deb libdevel optional arch=linux-any
 libcap2 deb libs optional arch=linux-any
 libcap2-bin deb utils important arch=linux-any
 libcap2-udeb udeb debian-installer optional arch=linux-any profile=!noudeb
 libpam-cap deb admin optional arch=linux-any
Checksums-Sha1:
 1551cef1dd86c56a41c6e5793a79d7a7a9c648fb 197868 libcap2_2.75.orig.tar.xz
 fe47ee3715175c88a5261a6f6275ea6eddf426dd 833 libcap2_2.75.orig.tar.xz.asc
 6295bbcaf6a5ffad653da306d98370d1e8966ecb 24628 libcap2_2.75-10+deb13u1.debian.tar.xz
Checksums-Sha256:
 de4e7e064c9ba451d5234dd46e897d7c71c96a9ebf9a0c445bc04f4742d83632 197868 libcap2_2.75.orig.tar.xz
 c71b593e7c3160fd7f406641074d93462bbc4906c9243937a0e232f42d5c54d2 833 libcap2_2.75.orig.tar.xz.asc
 d375de2f743f112835fc0eef2a9c305c1109371954cf53e109b7f046fe58c1bc 24628 libcap2_2.75-10+deb13u1.debian.tar.xz
Files:
 9406193ddb794dfbf9e71490053085f9 197868 libcap2_2.75.orig.tar.xz
 b8b508155e1073651e2cdceec97d57ff 833 libcap2_2.75.orig.tar.xz.asc
 bd8a37fcc3854a6b868fc525f62e0626 24628 libcap2_2.75-10+deb13u1.debian.tar.xz
Go-Import-Path: kernel.org/pub/linux/libs/security/libcap

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEQZ9+mkfDq5UZ8bCjOZU6N95Os2sFAmnUGOAACgkQOZU6N95O
s2tNpw/9Eq6LpFFxFqorV2POp7uhkGAbOa65BX+XECnUUxrToLec4FLY8KqhrOp1
ZMvZjZMHoBBlWkrzCU/CRMfRpVryvQWW+jjcYi/epVUhNLvR+nQlPTDqvU1Ipkue
2fhmR8GQ+8l58JmzMDcZleuT71E79SVTWWM3/hudhkrm6lmO754bf+Xo/SViacak
PwDCbJOab85rx6JhGsVh9vAMVDj/3kiVP/MTGA/TlprYnrTcpWeIDpWsacv7HA1P
Knh7vu0vHv1I09w6oJbOs6Mv4gCLjPHWT7iSLlF67z+ydIPB+/0l9RgAjVP99LlS
/qqHu3OwCypiQrkVjXiedg7Dql6R+h4GVv17EpjkckrDKyDpzw1wMhJENYzqc/KF
0bYbUN0KGM34OL/oAOxAy5IkAGNiwhlXSxo0VmfRGrEjE4a/70pHI5MM0w4RBxD1
xnrl26o5t6gcHiaFTYvjpt3tNYWADZuVp4JqK1Fo/741LVcj1+9XRHJaVMfPma30
NDo8KWHm2fQXsWUg3kqX9ZrhyAEcIm4QfNVmo2q+2NsYFkVNFgrJWHihs7bfeDBh
dNSgmMp8HotJF5FIHLm8AhgLA5mklycJBRPRvA5cm1B3yVEbGDzp2jzqKjmjIF1Z
ockiee/zeTxK/ZwJ5SBUwMJ3LeTyQ4ViAQLVeqyX25Kmr52P24Q=
=0kRy
-----END PGP SIGNATURE-----
