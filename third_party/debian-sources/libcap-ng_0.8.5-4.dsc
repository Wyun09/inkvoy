-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: libcap-ng
Binary: libcap-ng-dev, libcap-ng0, libcap-ng-utils, python3-cap-ng
Architecture: linux-any
Version: 0.8.5-4
Maintainer: Håvard F. Aasen <havard.f.aasen@pfft.no>
Homepage: https://people.redhat.com/sgrubb/libcap-ng
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/libcap-ng
Vcs-Git: https://salsa.debian.org/debian/libcap-ng.git
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, python3-all
Build-Depends: debhelper-compat (= 13), dh-sequence-python3 <!nopython>, libpython3-all-dev <!nopython>, linux-libc-dev, python3-all-dev:any <!nopython>, swig <!nopython>
Package-List:
 libcap-ng-dev deb libdevel optional arch=linux-any
 libcap-ng-utils deb admin optional arch=linux-any
 libcap-ng0 deb libs optional arch=linux-any
 python3-cap-ng deb python optional arch=linux-any profile=!nopython
Checksums-Sha1:
 37693cccf2a13576c7b642a19f83db298fd1979d 59265 libcap-ng_0.8.5.orig.tar.gz
 77af6afc188df68af65da122de5f56a8533f906a 7816 libcap-ng_0.8.5-4.debian.tar.xz
Checksums-Sha256:
 e4be07fdd234f10b866433f224d183626003c65634ed0552b02e654a380244c2 59265 libcap-ng_0.8.5.orig.tar.gz
 f5d4e7f38bdbca87de77317ce95f973883081370ef257019b484e29e3368a20d 7816 libcap-ng_0.8.5-4.debian.tar.xz
Files:
 8635fae2b1ead2381a9630d00e8f80b7 59265 libcap-ng_0.8.5.orig.tar.gz
 2ad63fc3fc68ea285be70a061474ab79 7816 libcap-ng_0.8.5-4.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iI0EARYIADUWIQSD/42dLkLq3fzhpN2I4w6v/UfCtwUCZ0eMrRccaGF2YXJkLmYu
YWFzZW5AcGZmdC5ubwAKCRCI4w6v/UfCt+BEAQC4hfzdrMCJWHwmV/y79CiyQZhy
3vjl3uBwhVxqpPzPQwD+LgBFoHzjHTdQWtXtoQq/v+gZkZxvXWLNWXyKpDmCIgY=
=4nvK
-----END PGP SIGNATURE-----
