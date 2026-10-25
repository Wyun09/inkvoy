-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: readline
Binary: libreadline8t64, libreadline8-udeb, lib64readline8, readline-common, readline-common-udeb, libreadline-dev, lib64readline-dev, rlfe, lib32readline8, lib32readline-dev, readline-doc
Architecture: any all
Version: 8.2-6
Maintainer: Matthias Klose <doko@debian.org>
Homepage: https://tiswww.case.edu/php/chet/readline/rltop.html
Standards-Version: 4.7.0
Build-Depends: dpkg-dev (>= 1.22.5), debhelper (>= 13), libncurses-dev, lib32ncurses-dev [amd64 ppc64] <!nobiarch>, lib64ncurses-dev [i386 powerpc sparc s390] <!nobiarch>, mawk | awk, texinfo, gcc-multilib [amd64 i386 kfreebsd-amd64 powerpc ppc64 s390 sparc] <!nobiarch>
Package-List:
 lib32readline-dev deb libdevel optional arch=amd64,ppc64 profile=!nobiarch
 lib32readline8 deb libs optional arch=amd64,ppc64 profile=!nobiarch
 lib64readline-dev deb libdevel optional arch=i386,powerpc,s390,sparc profile=!nobiarch
 lib64readline8 deb libs optional arch=i386,powerpc,s390,sparc profile=!nobiarch
 libreadline-dev deb libdevel optional arch=any
 libreadline8-udeb udeb debian-installer optional arch=any profile=!noudeb
 libreadline8t64 deb libs optional arch=any
 readline-common deb utils optional arch=all
 readline-common-udeb udeb debian-installer optional arch=all profile=!noudeb
 readline-doc deb doc optional arch=all
 rlfe deb utils optional arch=any profile=!cross
Checksums-Sha1:
 97ad98be243a857b639c0f3da2fe7d81c6d1d36e 3043952 readline_8.2.orig.tar.gz
 1a8c9b290d6c20c6c6ef27e41136720b4ba59ef4 38396 readline_8.2-6.debian.tar.xz
Checksums-Sha256:
 3feb7171f16a84ee82ca18a36d7b9be109a52c04f492a053331d7d1095007c35 3043952 readline_8.2.orig.tar.gz
 d1cf806644dbce298cf929f1cc9b3af5a50cd7db97b6f69db280c1eb2f544376 38396 readline_8.2-6.debian.tar.xz
Files:
 4aa1b31be779e6b84f9a96cb66bc50f6 3043952 readline_8.2.orig.tar.gz
 80013d77f64e5059c9e9bdc36f1a1489 38396 readline_8.2-6.debian.tar.xz
-----BEGIN PGP SIGNATURE-----

iQJEBAEBCgAuFiEE1WVxuIqLuvFAv2PWvX6qYHePpvUFAmdcN1gQHGRva29AZGVi
aWFuLm9yZwAKCRC9fqpgd4+m9YY2EACmPR4PDvKMbYe7LHhSpeti7TrxIAug3h1+
OvxB7WFX/lAoHAqeiw5vSVOK+5xX3dS2QFvoO7iAfSJN7EBXbjOdmByKM5ZFPpX8
peL/i5Y9hBsWBO0dgbyi5S46wGURzZJz/+cTlNan76SvkChYiwY+7R+UqQF/w6Dm
A5tZmb7XpFOkHqWWMcyb0O6mO508qVojjEa8rC7qkdDlFQawT2PmuXxhggNG331b
leLSVrROAI/TCbTo02tnu750y66FUa7AUOh6Ba1mnTq4RT4Pl/eV6hCNSVDBBytd
KJvdEU0rUHvIO9qNfFStMyoaskul4ptAnJD3iCXs6fdoXdvuXQV4V+efQYKODBFK
u3i5/ULvRktqyjQgNeQLqH84jxmLb8Z5zEi4iH/5hIckcYAdHfDDkRqOuBTmhJ90
0VjkPQtdVac5mJtW0xpZtvymEVeE01WkuS6FwUySnt5sto+tZuWoxYeoQKhCebOp
KxJUE6DPHPbSMXNGRLah3gGvHJdFP2tXMDUTWcwituGJl4rsYOqnDmIW7YRZM+9S
/tLjNNXMUrHYp2dxxiZYuVqe3dzky+jt8cqeIm/dSqDIxMNCxHSKmrJ7CedOjJM7
C+kIIDCYXYXw6tfEHABd4jkbsE6XIHLmj1EpKkrWN77ZGeJ/nh7Er3Z2SsHzAZba
EOV4zyBqwA==
=k9Sk
-----END PGP SIGNATURE-----
