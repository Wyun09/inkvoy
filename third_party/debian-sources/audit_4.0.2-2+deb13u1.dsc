-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: audit
Binary: auditd, libauparse0t64, libauparse-dev, libaudit1, libaudit-common, libaudit-dev, python3-audit, golang-redhat-audit-dev, audispd-plugins
Architecture: linux-any all
Version: 1:4.0.2-2+deb13u1
Maintainer: Laurent Bigonville <bigon@debian.org>
Homepage: https://people.redhat.com/sgrubb/audit/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/audit
Vcs-Git: https://salsa.debian.org/debian/audit.git
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, pkg-config, python3-all
Build-Depends: dpkg-dev (>= 1.22.5), debhelper-compat (= 13), dh-python <!nopython>, libcap-ng-dev, libkrb5-dev, libldap2-dev <!pkg.audit.noldap>, libwrap0-dev, linux-libc-dev (>= 5.9~), python3-all-dev:any <!nopython>, libpython3-all-dev <!nopython>, swig
Build-Depends-Indep: golang-any
Package-List:
 audispd-plugins deb admin optional arch=linux-any profile=!pkg.audit.noldap
 auditd deb admin optional arch=linux-any
 golang-redhat-audit-dev deb golang optional arch=all
 libaudit-common deb libs optional arch=all
 libaudit-dev deb libdevel optional arch=linux-any
 libaudit1 deb libs optional arch=linux-any
 libauparse-dev deb libdevel optional arch=linux-any
 libauparse0t64 deb libs optional arch=linux-any
 python3-audit deb python optional arch=linux-any profile=!nopython
Checksums-Sha1:
 fcb0bdecdaa649d1e688196713a824c332f37d65 1198769 audit_4.0.2.orig.tar.gz
 65bf7227fb8ee21bdbdf6d9493ad0ceb6a25acc4 25008 audit_4.0.2-2+deb13u1.debian.tar.xz
Checksums-Sha256:
 d5d1b5d50ee4a2d0d17875bc6ae6bd6a7d5b34d9557ea847a39faec531faaa0a 1198769 audit_4.0.2.orig.tar.gz
 ab39cb2d6dc6b0440da37f085b643dffc86d8cc5370b5cc6502d36b53edaa862 25008 audit_4.0.2-2+deb13u1.debian.tar.xz
Files:
 e21dfdc5d09b5e9bc66b6b8b0deddfb7 1198769 audit_4.0.2.orig.tar.gz
 56fa057cf3d98c57d03672612b14236f 25008 audit_4.0.2-2+deb13u1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEUryGlb40+QrX1Ay4E4jA+JnoM2sFAmqb1/wACgkQE4jA+Jno
M2u78Q//T7pEzE3F6M2EAj9TSzl6CTZr6scomNQa1F80Zjs6n2uaWug6PvvSlTsb
e0EXqdam/udOUL2UykhYe1lxYREeK1kAVCn+zr1Wme3wk/hnzbxU/j+vq2GklxG6
IAV80MMyl7lRJfW1X8Ppf7OkBcJwaQo+QeUoQt8GDjx1zb0C3XT4MxtMsH3MCUal
RQCTevFmIuOSwHeDPtr3I9k6IA5/5Ao35XFmZs6RxIyzyGIFLrc4HHm74p41Xwm8
ol4HZITvwK2F7Hb5ZXlFFcLAY5vVRRk7z7KatdKuYbMpv5QiU9hR6kQPk1hflvFH
c5uAvxbuN1ArRQO6NthgUpCdYh9TOS/ODh+iA3ytpTEBm5eFTt47Md47S3migTD/
IgcuWA9jTr+K23TpYsuwbhNc2KqnnHQ3DNzRfdw4DysCAYlEiG9x60rwy/xyuGk5
yUifVCvgzEHjxXbXolO0dXlW0WKIovPfqIRSsGE0AQuhLVVzNfWbWD31xa20RQh0
HfZk3cvuj5nk6J7wo0S9RnV+gv3xJiPnDaI2ueEBH/d88YVRkgviu6eXFAbvMMOm
4oPRxl38Ia9CfuTqzlQh7ePZKduWTlEPrRJkANaIcMMDyLOR1KvuyjrJTN4iVqQ3
xxkbWeojZCdEUOYD2yTJqCBtvpJWxkanV0gjxTj7r71L+hIH56g=
=b18Q
-----END PGP SIGNATURE-----
