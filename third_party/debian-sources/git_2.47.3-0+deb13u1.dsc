-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: git
Binary: git, git-man, git-doc, git-cvs, git-svn, git-mediawiki, git-email, git-gui, gitk, gitweb, git-all
Architecture: any all
Version: 1:2.47.3-0+deb13u1
Maintainer: Jonathan Nieder <jrnieder@gmail.com>
Uploaders: Anders Kaseorg <andersk@mit.edu>
Homepage: https://git-scm.com/
Standards-Version: 4.3.0.1
Vcs-Browser: https://repo.or.cz/w/git/debian.git/
Vcs-Git: https://repo.or.cz/r/git/debian.git/
Build-Depends: libz-dev, gettext, libpcre2-dev | libpcre3-dev, libcurl4-gnutls-dev, libexpat1-dev, subversion, libsvn-perl, libyaml-perl, tcl, python3, libhttp-date-perl | libtime-parsedate-perl, libcgi-pm-perl, liberror-perl, libmailtools-perl, cvs, cvsps, libdbd-sqlite3-perl, unzip, libio-pty-perl, debhelper-compat (= 10), dh-exec (>= 0.7), dh-apache2, dpkg-dev (>= 1.16.2~)
Build-Depends-Indep: asciidoc (>= 8.6.10), xmlto, docbook-xsl
Package-List:
 git deb vcs optional arch=any
 git-all deb vcs optional arch=all
 git-cvs deb vcs optional arch=all
 git-doc deb doc optional arch=all
 git-email deb vcs optional arch=all
 git-gui deb vcs optional arch=all
 git-man deb doc optional arch=all
 git-mediawiki deb vcs optional arch=all
 git-svn deb vcs optional arch=all
 gitk deb vcs optional arch=all
 gitweb deb vcs optional arch=all
Checksums-Sha1:
 408774745b5dadeddcf1e7223201927123e504ea 7657416 git_2.47.3.orig.tar.xz
 7242067a7c86f70fbd239d3d479a855b0ce320b9 793112 git_2.47.3-0+deb13u1.debian.tar.xz
Checksums-Sha256:
 9c2eb1250781b3e5bfef098572d07fdf132d67e6c065e4307332ade9819a1501 7657416 git_2.47.3.orig.tar.xz
 db44b90ab928d41959f5945a49fcaa101385a4bd085b118b5fd40162a0a84066 793112 git_2.47.3-0+deb13u1.debian.tar.xz
Files:
 467860ca61d8840cda3fb10db687f771 7657416 git_2.47.3.orig.tar.xz
 f42dbbc65c6800848bb2aa481e3fd8e4 793112 git_2.47.3-0+deb13u1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEOvp1f6xuoR0v9F3wiNJCh6LYmLEFAmioOaQACgkQiNJCh6LY
mLENVRAAgSpDBP23WUgAS6iYQeqHS9oBxq8FIh7bj3qvaVfKHxO7X+cWD6IxqibZ
7/5NRNFj0pJn3wit0CflphGQSH4wMDBXLBMAazhyNMs1GjcQCY9inOj0BMSBjlMb
jjfwIdt+uoeNiL1eUshSPmIbF+fFmVRdtfhlhojvFoNg1gTVEOEhlD0vY5E0p2A6
uX+7VY2NxKImDIHsl8b9/0BIjpt4Uv1Dsf4MGxNd2GrAoFmIDEPuzzCdU2ux8Nl+
Dg4VHCp+SFAd+2MggC4/Gw2LOajhRpvwyXF2vziKEfw+65Bd9lQfMLairEwx5MXE
6AwXXinqlvIuFvwfND/Kw/wOMvqTt8OF9IsrgsggsB1iozX3M1TzTspfo4yNv+PW
QA6o0L+1eWA9FrXthw40KbQ6rGpqY4SvrpQLo8S/JocpXHsmzMupX8aGy5i4e3Pr
iWm24G7L0Lw1Z5+G5r7QPVTSdJ1emfNX7t5X0nrn71nn2bIOlLbVoIniucK2kaUT
Dsutyg2EUxlHUWOPoZH7V7L2uaJPKZfygFdE5EUroi1W2kXNdycsRVXjDLPlLoZi
raAjecrGxUBnLyAH4mzMxZz58kN2kyeWE9ZNEtLWPxMzaufjbgdN+excbi9E3gk2
KAI0RLbeWdzIe6KTc+kqDlTLUHmJMYEwAPzV1iozKTgS9PQNO3g=
=nHd9
-----END PGP SIGNATURE-----
