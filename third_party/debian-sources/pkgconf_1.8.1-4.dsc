-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: pkgconf
Binary: pkgconf, pkgconf-bin, libpkgconf3, libpkgconf-dev, pkg-config
Architecture: any
Version: 1.8.1-4
Maintainer: Andrej Shadura <andrewsh@debian.org>
Homepage: http://pkgconf.org/
Standards-Version: 4.6.0
Vcs-Browser: https://salsa.debian.org/debian/pkgconf
Vcs-Git: https://salsa.debian.org/debian/pkgconf.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, libsdl2-dev
Build-Depends: debhelper-compat (= 13), kyua <!nocheck>, atf-sh <!nocheck>
Package-List:
 libpkgconf-dev deb libdevel optional arch=any
 libpkgconf3 deb libs optional arch=any
 pkg-config deb oldlibs optional arch=any
 pkgconf deb devel optional arch=any
 pkgconf-bin deb devel optional arch=any
Checksums-Sha1:
 5d338fad0c8e2374687f42cadfdd8ebf8ab5dffc 302372 pkgconf_1.8.1.orig.tar.xz
 718be32dec07551a44dec9bcb0c89775db7e6f85 17736 pkgconf_1.8.1-4.debian.tar.xz
Checksums-Sha256:
 644361ada2942be05655d4452eb018791647c31bba429b287f1f68deb2dc6840 302372 pkgconf_1.8.1.orig.tar.xz
 e56c56a5f40eb0d57bebcb79983a755e16cf1e1595a6fec7f02b20bd58baa734 17736 pkgconf_1.8.1-4.debian.tar.xz
Files:
 51fad3383640dfc47a92731581dd2917 302372 pkgconf_1.8.1.orig.tar.xz
 37cad92e0b93810e056250ffe294b9c0 17736 pkgconf_1.8.1-4.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIyBAEBCAAdFiEEfRrP+tnggGycTNOSXBPW25MFLgMFAmcVSO8ACgkQXBPW25MF
LgPJsA/3TcViLZRTtAoWmK9xWJ3PXhBowlA9V0iJjRgIZBmKGa/jY6y6iircALyH
yVrgIi9ySfI4wH2GPCAh5VCUH6Mc5E6xld0iI+2tc/sF3eD4OCCszcVjyI/GgFHm
U5Xgm0y6T2V6ptnDprSoTtLDvSm+6WUtXNpXfLodKrPsr5TIRznzVKb/HpmoPSiS
AGfox6OmhVE96tmXRCzfDrO/qxeBsWQLOL2pSK3zC+JQClLlmn90dyDz7inNCGoG
D4e8EJTKb9kB/EdDFqHgyKr6Phw3tAvVu8jqFEhiyzV/1ry5j3Eve0cDOK6oaewA
E9JWHsyGMMRC6Y6ABgFO68/7bWHE1p1FTC2WtU1ZcMPgKxQz6v8R4PiYAkQJ+vG5
7OWwsET9Lpy0IOAU3jlRTWw6IFF8KpVw/BsIR0idduS+Bxt7iXOUNMJ77maqORis
XfJKjdEQ8lhdpuKgUJITbBpOMlc8AocUXx+nr/oDSoTlehEf2PMQ9gzwXHiBpphl
2q1T3Zfs5IGKzT1D7xwT0htIxsvYT3NRTEVU6fI6BRudtTo8jbPPxUP9/+tmRHi8
kdXAn+00LHa24LV04wRaykHoIjD3chEYTQl8MAAa3ufR81sA3mfn5ia58Jzu/IVE
FctBGxGz/C9f9G9YB4IxUCFFf8GMDaV+2AM2BXR5G9R5vD+CxA==
=klie
-----END PGP SIGNATURE-----
