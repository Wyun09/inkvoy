-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: pam
Binary: libpam0g, libpam-modules, libpam-modules-bin, libpam-runtime, libpam0g-dev, libpam-doc
Architecture: any all
Version: 1.7.0-5
Maintainer: Sam Hartman <hartmans@debian.org>
Homepage: http://www.linux-pam.org/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/vorlon/pam
Vcs-Git: https://salsa.debian.org/vorlon/pam.git
Testsuite: autopkgtest
Testsuite-Triggers: python3-pam
Build-Depends: debhelper-compat (= 13), dh-exec, flex, libcrypt-dev, libdb-dev, libselinux1-dev [linux-any], libsystemd-dev [linux-any] <!stage1>, po-debconf, meson, libaudit-dev [linux-any] <!stage1>, pkgconf, libfl-dev, libfl-dev:native
Build-Depends-Indep: docbook-xsl-ns, docbook5-xml, xsltproc, libxml2-utils, w3m, fop
Build-Conflicts: libdb4.2-dev, libxcrypt-dev
Package-List:
 libpam-doc deb doc optional arch=all profile=!nodoc
 libpam-modules deb admin required arch=any
 libpam-modules-bin deb admin required arch=any
 libpam-runtime deb admin required arch=all
 libpam0g deb libs optional arch=any
 libpam0g-dev deb libdevel optional arch=any
Checksums-Sha1:
 935f3a737f834ac94a6600e4e3619de47e0cfa6a 507824 pam_1.7.0.orig.tar.xz
 0cc8ae9ba7a17610041e702b70eaba8765f93ced 801 pam_1.7.0.orig.tar.xz.asc
 e27bfdcceb1294670f95467e4ce4e2455ce841c7 145640 pam_1.7.0-5.debian.tar.xz
Checksums-Sha256:
 57dcd7a6b966ecd5bbd95e1d11173734691e16b68692fa59661cdae9b13b1697 507824 pam_1.7.0.orig.tar.xz
 7a8ea18ec7d9dd1f8cbf9055c32128cbca8241aa63e9fea44d56ce6f0e15e441 801 pam_1.7.0.orig.tar.xz.asc
 d776d7cb6fc8b08273f96b7f843299356ef13c6756e30468c594ab28faf1701c 145640 pam_1.7.0-5.debian.tar.xz
Files:
 c1e41d59d6852e45d0f953c8c8f869d6 507824 pam_1.7.0.orig.tar.xz
 9a57369709c01169ecc6b2ff59a43db6 801 pam_1.7.0.orig.tar.xz.asc
 8b227938c26350801ea2472d00c52c58 145640 pam_1.7.0-5.debian.tar.xz
Dgit: c824d4ecb7720545371f3d7062173cc171a8ac50 debian archive/debian/1.7.0-5 https://git.dgit.debian.org/pam

-----BEGIN PGP SIGNATURE-----

iHUEARYKAB0WIQSj2jRwbAdKzGY/4uAsbEw8qDeGdAUCaGF7eAAKCRAsbEw8qDeG
dHwlAQD1lNdmTUMyVGNcImbIJOcdS5BOjw4L2Cp1mq0/1/kFWAD/crmAIt2N/Cgn
Jj8aEdvUWP2tfuV6PQaHZrbx/cEcVA4=
=e39Y
-----END PGP SIGNATURE-----
