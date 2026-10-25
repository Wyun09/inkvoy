-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: db5.3
Binary: db5.3-doc, libdb5.3-dev, libdb5.3t64, db5.3-util, libdb5.3++t64, libdb5.3++-dev, libdb5.3-dbg
Architecture: any all
Version: 5.3.28+dfsg2-9
Maintainer: Debian QA Group <packages@qa.debian.org>
Homepage: http://www.oracle.com/technetwork/database/database-technologies/berkeleydb/overview/index.html
Standards-Version: 3.9.6
Vcs-Browser: https://salsa.debian.org/debian/db5.3
Vcs-Git: https://salsa.debian.org/debian/db5.3.git
Build-Depends: dpkg-dev (>= 1.22.5), debhelper (>= 10), tcl <cross !pkg.db5.3.notcl>, tcl-dev <!pkg.db5.3.notcl>, procps [!hurd-any] <!nocheck>
Package-List:
 db5.3-doc deb doc optional arch=all
 db5.3-util deb database optional arch=any
 libdb5.3++-dev deb libdevel optional arch=any
 libdb5.3++t64 deb libs optional arch=any
 libdb5.3-dbg deb debug optional arch=any
 libdb5.3-dev deb libdevel optional arch=any
 libdb5.3t64 deb libs optional arch=any
Checksums-Sha1:
 c2e52e52021c4df2ebff57f1fb68e2879d65376a 21287688 db5.3_5.3.28+dfsg2.orig.tar.xz
 b22b47d5420774557ddbed0a50f1e2d9f100c911 36412 db5.3_5.3.28+dfsg2-9.debian.tar.xz
Checksums-Sha256:
 ad41b507415dec8316e828b2230242af2251d2c86eefa3c7aa9ef47c5239ef33 21287688 db5.3_5.3.28+dfsg2.orig.tar.xz
 21fe6ee0491c83d0c34fe52e0e0e423946172eff68262584a0cc8ef880c36b74 36412 db5.3_5.3.28+dfsg2-9.debian.tar.xz
Files:
 d98fe4179fb622a9f4abe3afed6a2158 21287688 db5.3_5.3.28+dfsg2.orig.tar.xz
 d2319c201aec26c774fe504ff7e341a8 36412 db5.3_5.3.28+dfsg2-9.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEOvp1f6xuoR0v9F3wiNJCh6LYmLEFAmcOVkMACgkQiNJCh6LY
mLHBJA/9FlKTWtj2RrmqsNGWPg+SW2rLcLW9DjBiQ2jQ7ZdJgJbg+j9FQKZYB7yd
OUiFPKY0TsUpdqHv0AAQSkUzWtw6CRBqmn91u9XtAIRe2CQPXC5RHzIsfE3f8SpT
mHOHaxH1j6CoWemLXuE4LYFnE74NyAp5X+zIIWLHp11npGL/FcvkIcwIrnaqq07h
uJ213DXTTe6UoCEjr0VsNLxRPuVg5sG82Ef/M0vDrTpdsGz3I/+fgp2JQadquegZ
KQGBuHcgCxSGViBusObA+0LFTtq3GMjqFUDtmmXJFt+SimqgaBzA10uSRlRN3YcU
jY647GvL2fLtM7dZgJ35UHEk4gq0+LzPiBbn/+SPbj7pAsAp/hI/KRW6V9V56kO5
TEBAUGAwLHNsL+S2Jx1vzJINqlp2zhHlEk4VDHq2t+40L9YJjWRokgWspyjCPtmK
SElA6pCWpg6DneIDr/1WEdZAdFxa6qS8c+WtlaAnBnnaUgAyMJGlKgMJ16hPlcrN
e0RU7hfTsPXm6PSUdp3JJfrbae2H/Oul2sbgIlDSS1MCc98/Gha7tAdA8YZL8eyd
UeEiIn1wS3P7NNepKl/Bmi4AjV7rWl6amX+L0vhwHSdqP0MquLMSNx0j1UDWu+Ak
khPm1yhboJsaQwigjDwP0Rk1b0a2v0AHMVsHnLYVCccLs/Mka3w=
=Gh0w
-----END PGP SIGNATURE-----
