-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: acl
Binary: acl, libacl1-dev, libacl1, acl-udeb, libacl1-udeb
Architecture: any
Version: 2.3.2-2
Maintainer: Guillem Jover <guillem@debian.org>
Homepage: https://savannah.nongnu.org/projects/acl/
Standards-Version: 4.6.2
Vcs-Browser: https://git.hadrons.org/cgit/debian/pkgs/acl.git
Vcs-Git: https://git.hadrons.org/git/debian/pkgs/acl.git
Testsuite: autopkgtest
Testsuite-Triggers: autoconf, automake, autopoint, build-essential, libattr1-dev, libtool, pkgconf
Build-Depends: debhelper-compat (= 13), debhelper (>= 13.10), autoconf, automake, gettext, libtool, libattr1-dev (>= 1:2.4.46-8)
Package-List:
 acl deb utils optional arch=any
 acl-udeb udeb debian-installer optional arch=any profile=!noudeb
 libacl1 deb libs optional arch=any
 libacl1-dev deb libdevel optional arch=any
 libacl1-udeb udeb debian-installer optional arch=any profile=!noudeb
Checksums-Sha1:
 2674394a4061791c77d80fd2089a39c3675a5980 371680 acl_2.3.2.orig.tar.xz
 884c1cae6bbc52db9deba2f5523f6624df796201 833 acl_2.3.2.orig.tar.xz.asc
 a69f6cb6c5eeb21e17debd698968c5c9c03782b6 24296 acl_2.3.2-2.debian.tar.xz
Checksums-Sha256:
 97203a72cae99ab89a067fe2210c1cbf052bc492b479eca7d226d9830883b0bd 371680 acl_2.3.2.orig.tar.xz
 184c6a903490885a096095db67b433a04542c6569f167cbe8115268c0f227273 833 acl_2.3.2.orig.tar.xz.asc
 e27b6e194c0a7554595d76f96acdceb800631bdc46c36457b73bc7e4a0c5f2ee 24296 acl_2.3.2-2.debian.tar.xz
Files:
 590765dee95907dbc3c856f7255bd669 371680 acl_2.3.2.orig.tar.xz
 ea6ee7f69d122317eabf7641aeb083ff 833 acl_2.3.2.orig.tar.xz.asc
 c4b10acfc329b6121017873998c872bb 24296 acl_2.3.2-2.debian.tar.xz


-----BEGIN PGP SIGNATURE-----

wsG7BAEBCgBvBYJmM/cfCRC5cr8+pK5Xo0cUAAAAAAAeACBzYWx0QG5vdGF0aW9u
cy5zZXF1b2lhLXBncC5vcmd8hGKP6yemqAN507Ta53HItg5CHBpznFAMhgFGC9MT
RhYhBE8+dPQ2BQwQ9WlldLlyvz6krlejAAC6cA//Qdmuf1VOSkI/MvZCUJHL/872
KZzwUFIMA6u+i1zpumwcyENcotnh7uzfi9Hbjp9avfDcbFXPpqEPdpqQmwCofBkC
AAm1EyHVP9fPbYPO6uY7jNS0dF983sJBixEvXxPXru6Pabj7Is5ASFQjM5gsvi4E
pRfcFr1ApQhJOPcs+U34OkodATPkjJdoCOvilWh6nW3/yeIoQmUENAkSe/7Q1Rkx
Yc3aNqpgjWqv58P3fNihjCgTjrzdMXQC3B4a4ZpPouy1cvyf9No7qv/fl48P8dty
sFMjgXz6yszHSZtXhMDQ/p9qql+em6GcJU8gwIi12JBf5uh7+F+JsdTEPYivQIdH
bA7vKRenNJPFDq1a7r+twc2LSnWP9jaWCx+5IChZJe/LAgSFSCW6UZi9/oCMq1Qh
RncCvDlQFmrX4C1Q1lMgngTAjiHUQlTYcPKCNfSmxQAFaOijGo779wAycRX4mbtr
t55SnEWjB25/SN38iG+hPclhpN+VcmgWVxZmC2LxHBh0a8LyfuRLO+I7Iw2GNxqx
Pzgxh0tyjk+rf6PD0M6l0/WATdHS7xjdLLRy/QdITAxHhOsDpSxBk/jCsyqo0clC
B8Vk/SjalF4IT5BejFU/q1xHeCNBigfPQSZBD39G+gyLqGWd+C/SyLgRdTExKCQR
pTL0kiS7NQvfhoyJbXw=
=NXPb
-----END PGP SIGNATURE-----
