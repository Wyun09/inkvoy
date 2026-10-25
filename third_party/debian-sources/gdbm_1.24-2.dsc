-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: gdbm
Binary: libgdbm6t64, gdbm-l10n, libgdbm-dev, gdbmtool, libgdbm-compat4t64, libgdbm-compat-dev
Architecture: any all
Version: 1.24-2
Maintainer: Nicolas Mora <babelouest@debian.org>
Homepage: https://gnu.org/software/gdbm
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/gdbm
Vcs-Git: https://salsa.debian.org/debian/gdbm.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, build-essential
Build-Depends: dpkg-dev (>= 1.22.5), texinfo, debhelper-compat (= 13), dh-exec, libreadline-dev, bison, flex
Package-List:
 gdbm-l10n deb localization optional arch=all
 gdbmtool deb utils optional arch=any
 libgdbm-compat-dev deb libdevel optional arch=any
 libgdbm-compat4t64 deb libs optional arch=any
 libgdbm-dev deb libdevel optional arch=any
 libgdbm6t64 deb libs optional arch=any
Checksums-Sha1:
 7bd455f28c9e4afacc042e0c712aac1b2391fef2 1195931 gdbm_1.24.orig.tar.gz
 8440bafd4abb8dc198e928dfd927e1defa2daa61 195 gdbm_1.24.orig.tar.gz.asc
 e30ff28c6344b69a69e3cab9d6e5e9957d65b1ae 16880 gdbm_1.24-2.debian.tar.xz
Checksums-Sha256:
 695e9827fdf763513f133910bc7e6cfdb9187943a4fec943e57449723d2b8dbf 1195931 gdbm_1.24.orig.tar.gz
 8fb2f87e817ed6bd1d7ef2ab976f6a0046814a5ff28a06c521b796e0d3fd1226 195 gdbm_1.24.orig.tar.gz.asc
 736d23450674c1bf0b03a2f65b83870b0801bc3747df3099df970c1479b0ab63 16880 gdbm_1.24-2.debian.tar.xz
Files:
 c780815649e52317be48331c1773e987 1195931 gdbm_1.24.orig.tar.gz
 fb084d1be9ca8f15d30dfbfd0e636beb 195 gdbm_1.24.orig.tar.gz.asc
 7271293cebcd73f41a666fd8ec49a90f 16880 gdbm_1.24-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEhAWwL8wo75dEyPJT/oITlEC9IrkFAmazlucACgkQ/oITlEC9
IrllQBAAkp02jUHvQRyMJeA6wpqqbopUo3dj7sAttYriGh2HbIMheiLJgmAgCyRZ
zifafAiincM6W5NOqs+ruSbwcE8Rc67v/7aZkEMEAwosuKUkiR9/iHPxd4PLtL0R
261rksAKZdwCrJh3QK58gmzyG4iTr++YgPDR1yX+FlAIsVmuZCT77TsY7DOwker5
3DtzeA4oEpF5A7DZhQIdPPmR+6fkO1hIwPh0fipqUDYnuLKqbe+v4xB0VT4eaSoJ
D2Y6Om1BrvEpmyQiB4/wCURlzRH8GzqoFE/+qJc1ftO5e2w4umMTOBXzeoX+dkh+
6NeHzCzcQVwgs6DS7sKS7ZdvQqNZw+hTvU2eythX3aDZymm1Bi3PKa6WVDqFodvE
gEBRlt/2eErCG8mLQFuO9aGUJ32aJtCX3rHEKWyLOdvYP4Fr4STerBR7KDUfaL7l
eCIJdvQxsX8DWMsMItakjC5oL728UTBZaXTlS/bYXdiiaLvnQu1z7GT8HnlFZucI
mcyPfM6Y0w/0/XRGd2h4LcbJdDThg5LGoqkWFOzbRW8dVGirVTKSnxTeatf0buji
iCHTs7sCheCAPKnv1zBvYdUtKsNo3DfgknyCcn65KwmrCelV2g1y3IRHrAFXoY9W
i9mMoLGiiFAiUz5LO0Feauq1lkvoPjbLv21RBt1K2aa8RWOavUw=
=t0OR
-----END PGP SIGNATURE-----
