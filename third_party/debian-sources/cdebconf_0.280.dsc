-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (native)
Source: cdebconf
Binary: cdebconf, cdebconf-gtk, libdebconfclient0, libdebconfclient0-dev, cdebconf-udeb, cdebconf-priority, libdebconfclient0-udeb, cdebconf-text-udeb, cdebconf-newt-udeb, cdebconf-gtk-udeb
Architecture: any all
Version: 0.280
Maintainer: Debian Install System Team <debian-boot@lists.debian.org>
Uploaders:  Colin Watson <cjwatson@debian.org>, Cyril Brulebois <kibi@debian.org>
Standards-Version: 3.9.7
Vcs-Browser: https://salsa.debian.org/installer-team/cdebconf
Vcs-Git: https://salsa.debian.org/installer-team/cdebconf.git
Build-Depends: debhelper-compat (= 13), po-debconf, libslang2-dev, libnewt-dev, libtextwrap-dev, libreadline-dev (>= 8.1.2-1.1), libdebian-installer4-dev | libdebian-installer-dev, libglib2.0-dev, libgtk2.0-dev <!pkg.cdebconf.nogtk>, libcairo2-dev <!pkg.cdebconf.nogtk>, libselinux1-dev [linux-any] | libselinux-dev [linux-any], dh-autoreconf, dh-exec
Package-List:
 cdebconf deb utils optional arch=any
 cdebconf-gtk deb admin optional arch=any profile=!pkg.cdebconf.nogtk
 cdebconf-gtk-udeb udeb debian-installer optional arch=any profile=!pkg.cdebconf.nogtk
 cdebconf-newt-udeb udeb debian-installer optional arch=any
 cdebconf-priority udeb debian-installer standard arch=all
 cdebconf-text-udeb udeb debian-installer optional arch=any
 cdebconf-udeb udeb debian-installer standard arch=any
 libdebconfclient0 deb libs optional arch=any
 libdebconfclient0-dev deb libdevel optional arch=any
 libdebconfclient0-udeb udeb debian-installer optional arch=any
Checksums-Sha1:
 eaddf7a38a41aa060d81a5cdf659561d1ab0a4e3 286132 cdebconf_0.280.tar.xz
Checksums-Sha256:
 c42115131939845e452a323ceded937efad3b2e3e1b80a1a186f9d5c494a43a2 286132 cdebconf_0.280.tar.xz
Files:
 81890ed89fea2f196646f630fff66193 286132 cdebconf_0.280.tar.xz

-----BEGIN PGP SIGNATURE-----

iQJEBAEBCgAuFiEEtg6/KYRFPHDXTPR4/5FK8MKzVSAFAmh8dSgQHGtpYmlAZGVi
aWFuLm9yZwAKCRD/kUrwwrNVIE3gD/49shewh5WdLEdnvARhRWPYgrmD1nbJRdOw
kZoc1W5cZpC8LXqdFjjmEwGlYCS7dKtNpoyaJpxqm7BHvn7pSLDkdZ3zRJv6a1ci
htfXO0zf+tQAqdVJqBg6nY9Rxl0h0314vkjd3mBkL/Q87Qz15nM/NV6mURZLgmqe
hv7IUo+TBYX0ICNkMP8do/UJs5cSrhowZn0kRYkg2/rPnt2dhUH9FOEEIHTQG4GT
pV5Dta2SjxrGsxUQpKA7T/1GRGaDMvRzb/Y2TirsrP47dWTFt6p37jHtWnkNs2Ui
3GD0PDWMMcZGeWOGmELBCXSnUWc1nLkP25T9U+7FNY0alpj9ucBfAHCgtzx8aO1a
NEm9QST0gAEH1JJt9XiOjCViHvIMkGCK9GDrh7/jz2MlZdoFOb02u+BS69/XxESi
HwqB6UfEaGAzjDRLBDiYvofBvWBiRPuC0YqCKwUu78RJ7B7uNJsOOIwjJt/Tr7FV
Uw4SHrHqTQwfmr5D6TzetMJxtwOQmBBWYuagRE9JI8Sn6zXteayZ82Jf+uVK10u3
2r2PfBwE9aoqk1EMgn90/xcznKus9l3kPZjIfeKjFLuv1PMo8KO2orIUyWglGta8
g8ggkSNErOGDQZ6diNEgretDpr8px5J40NGFKWFVJG+QnLj8LnA+Oja1QOZEZnx8
BQuniYl7Bw==
=tx5S
-----END PGP SIGNATURE-----
