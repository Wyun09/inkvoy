-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: grep
Binary: grep
Architecture: any
Version: 3.11-4
Maintainer: Anibal Monsalve Salazar <anibal@debian.org>
Uploaders: Santiago Ruano Rincón <santiago@debian.org>
Homepage: https://www.gnu.org/software/grep/
Standards-Version: 4.6.1.1
Vcs-Browser: https://salsa.debian.org/debian/grep
Vcs-Git: https://salsa.debian.org/debian/grep.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, fakeroot, libpcre2-8-0, locales-all
Build-Depends: debhelper-compat (= 13), dh-sequence-movetousr, gettext, libpcre2-dev, texinfo <!nodoc>
Package-List:
 grep deb utils required arch=any essential=yes
Checksums-Sha1:
 955146a0a4887eca33606e391481bbef37055b86 1703776 grep_3.11.orig.tar.xz
 55d07b1247899b99e5b6cb956b0720491c235f32 833 grep_3.11.orig.tar.xz.asc
 3686e9c246f03108dad1379f3e1d666fbd065d91 20468 grep_3.11-4.debian.tar.xz
Checksums-Sha256:
 1db2aedde89d0dea42b16d9528f894c8d15dae4e190b59aecc78f5a951276eab 1703776 grep_3.11.orig.tar.xz
 89ec23ffd59b68822732dc8204fc89883c3af30a90ae390feb94346d9d09a589 833 grep_3.11.orig.tar.xz.asc
 f10394b7589c58ca7de4b580692b1b59431f898cb2068e86222c174e093fdf49 20468 grep_3.11-4.debian.tar.xz
Files:
 7c9bbd74492131245f7cdb291fa142c0 1703776 grep_3.11.orig.tar.xz
 dca377728931fa16b0a5c0f1f50f436e 833 grep_3.11.orig.tar.xz.asc
 332d6fe3cff80c3e65baab694da6e037 20468 grep_3.11-4.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iHUEARYIAB0WIQRZVjztY8b+Ty43oH1itBCJKh26HQUCZZbBjQAKCRBitBCJKh26
HRghAP4n6g9bBQ9uOTmVQcJ4gOmJuLejtpflo+7lwDljle2SuwEA/BfuuA2qCLFT
3De9lk42AhVzT7MTLYRfyu8W45NL9QE=
=gX+4
-----END PGP SIGNATURE-----
