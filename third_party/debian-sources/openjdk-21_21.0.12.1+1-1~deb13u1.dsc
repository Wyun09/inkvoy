-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: openjdk-21
Binary: openjdk-21-jdk-headless, openjdk-21-jre-headless, openjdk-21-jdk, openjdk-21-jre, openjdk-21-demo, openjdk-21-source, openjdk-21-doc, openjdk-21-dbg, openjdk-21-testsupport, openjdk-21-jre-zero
Architecture: alpha amd64 arc armel armhf arm64 i386 loong64 mips64el powerpc ppc64 ppc64el m68k riscv64 sh4 sparc sparc64 s390x x32 all
Version: 21.0.12.1+1-1~deb13u1
Maintainer: OpenJDK Team <openjdk-21@packages.debian.org>
Uploaders: Matthias Klose <doko@ubuntu.com>, Vladimir Petko <vladimir.petko@canonical.com>
Homepage: https://openjdk.java.net/
Standards-Version: 4.6.2
Vcs-Browser: https://salsa.debian.org/openjdk-team/openjdk/tree/openjdk-21
Vcs-Git: https://salsa.debian.org/openjdk-team/openjdk.git -b openjdk-21
Testsuite: autopkgtest
Testsuite-Triggers: bash, build-essential, dbus-x11, jtreg7, libatk-wrapper-java, libatk-wrapper-java-jni, libtestng7-java, lsb-release, xauth, xfwm4, xvfb
Build-Depends: debhelper (>= 11), m4, lsb-release, zip, unzip, sharutils, gawk, cpio, procps, wdiff, pkgconf, fastjar (>= 2:0.96-0ubuntu2), time, strip-nondeterminism, debugedit (>= 4.16), jtreg7 (>= 7.5.2+1~) <!nocheck>, libtestng7-java <!nocheck>, xvfb <!nocheck>, xauth <!nocheck>, xfonts-base <!nocheck>, libgl1-mesa-dri [!x32] <!nocheck>, xfwm4 <!nocheck>, x11-xkb-utils <!nocheck>, dbus-x11 <!nocheck>, libasmtools-java <!nocheck>, autoconf, automake, ant, ant-optional, g++-14 <!cross>, openjdk-21-jdk-headless:native | openjdk-20-jdk-headless:native, libxtst-dev, libxi-dev, libxt-dev, libxaw7-dev, libxrender-dev, libcups2-dev, libasound2-dev, liblcms2-dev, libxinerama-dev, libkrb5-dev, xsltproc, libpcsclite-dev, libxrandr-dev, libelf-dev, libfontconfig-dev, libfreetype-dev, libharfbuzz-dev, libffi-dev, libffi-dev:native, zlib1g-dev:native, zlib1g-dev, libattr1-dev, libpng-dev, libjpeg-dev, libgif-dev, systemtap-sdt-dev [!powerpc !ppc64 !ppc64el !sh4 !s390x], libnss3-dev (>= 2:3.17.1), openjdk-21-jdk-headless <cross>
Build-Depends-Indep: graphviz, pandoc
Package-List:
 openjdk-21-dbg deb debug optional arch=alpha,amd64,arc,armel,armhf,arm64,i386,loong64,mips64el,powerpc,ppc64,ppc64el,m68k,riscv64,sh4,sparc,sparc64,s390x,x32
 openjdk-21-demo deb java optional arch=alpha,amd64,arc,armel,armhf,arm64,i386,loong64,mips64el,powerpc,ppc64,ppc64el,m68k,riscv64,sh4,sparc,sparc64,s390x,x32
 openjdk-21-doc deb doc optional arch=all
 openjdk-21-jdk deb java optional arch=alpha,amd64,arc,armel,armhf,arm64,i386,loong64,mips64el,powerpc,ppc64,ppc64el,m68k,riscv64,sh4,sparc,sparc64,s390x,x32
 openjdk-21-jdk-headless deb java optional arch=alpha,amd64,arc,armel,armhf,arm64,i386,loong64,mips64el,powerpc,ppc64,ppc64el,m68k,riscv64,sh4,sparc,sparc64,s390x,x32
 openjdk-21-jre deb java optional arch=alpha,amd64,arc,armel,armhf,arm64,i386,loong64,mips64el,powerpc,ppc64,ppc64el,m68k,riscv64,sh4,sparc,sparc64,s390x,x32
 openjdk-21-jre-headless deb java optional arch=alpha,amd64,arc,armel,armhf,arm64,i386,loong64,mips64el,powerpc,ppc64,ppc64el,m68k,riscv64,sh4,sparc,sparc64,s390x,x32
 openjdk-21-jre-zero deb java optional arch=amd64,i386,arm64,armhf,ppc64,ppc64el,riscv64,s390x
 openjdk-21-source deb java optional arch=all
 openjdk-21-testsupport deb java optional arch=alpha,amd64,arc,armel,armhf,arm64,i386,loong64,mips64el,powerpc,ppc64,ppc64el,m68k,riscv64,sh4,sparc,sparc64,s390x,x32
Checksums-Sha1:
 a49bb4429a084922d8ce3e88377c11f7ee9ef4ba 615644 openjdk-21_21.0.12.1+1.orig-googletest.tar.xz
 a92ca0ad6bd7fdddb3a93039be0f1d4e096932a9 67853652 openjdk-21_21.0.12.1+1.orig.tar.xz
 74754c2c609948231fce8de6e77a758bab3c1a6f 232260 openjdk-21_21.0.12.1+1-1~deb13u1.debian.tar.xz
Checksums-Sha256:
 94695f01012f939e8eeb51f839dd11323a57a6bb70dee8a34c7a7a1cddf00905 615644 openjdk-21_21.0.12.1+1.orig-googletest.tar.xz
 ec270145b9c8870e6f0263597efefc6e2c90d99dbe41135b3d8fb8b887499aa5 67853652 openjdk-21_21.0.12.1+1.orig.tar.xz
 b81c5aee89347faf1777b44a487d8ca3e323f5253be6da56b574dbba7cce98a5 232260 openjdk-21_21.0.12.1+1-1~deb13u1.debian.tar.xz
Files:
 b691bf35915e21efb8a5d26be6ac88a2 615644 openjdk-21_21.0.12.1+1.orig-googletest.tar.xz
 1b7ef54ea33b818d5a456196f67ab5fb 67853652 openjdk-21_21.0.12.1+1.orig.tar.xz
 8129cc64588adcd27efb597a7329c92e 232260 openjdk-21_21.0.12.1+1-1~deb13u1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEtuYvPRKsOElcDakFEMKTtsN8TjYFAmqF7zsACgkQEMKTtsN8
Tja34Q/+O0FfRcNwBzc6NqEkXeoKkgU5OsM4CANsIDKnb7tVRHdiSSkSgWOdcoxa
RJLoEPIi/snMj2h3cRqaz4XFOkyKcdWXSgd7Zxvylaw1TzbM2ABrcGYKqqhRtMKH
bX5NNVMCmvkoHJY2EaLhhdoBu2/MDVU4zRU2UFP9OufbJ2j0sB1uCVNRBd9IQ6c8
bF3+a9LH4GuRQVIY6vTIGv6aAPPKCOgujZT1m6oaSRG421FIdY+XaNFhlNqJT+hE
eULq5cVnf7jCQ6GH4173WcSdmI9w1f+Mqt/GHMD+Cu/pWuVO1WsS+BOxU8IUlbQp
i5gXWHvSc05XSUdWe8eDfW/1F/WXIPbUy+2GQbnILsd3Z2ATbY4WtJJ2EMbYmP92
NkFmdHUSf/A8jXNsfa2km+nEzA1BLgU7oOtz0WfgEj8cBSuS4Eol+3MOGAwhi3Id
OE5XIlV01yI7zvTyYKbux1hKJ9QShDXZB1TXwqRioECZpX8l/Z+H8n9SVSduRjSy
3+7nGy2VhegCQtJa6/yp1hglhf2HduZLaaVOY1cHnlh8EV+/xy0hJPlBHTdCSvM9
DN6GaE1e8p9bZNFr9S1sfv+jGdX/On9MkD3Jzf5YlXJmsiDjsr+hvFxhAgRJZG53
4OCbE6GbLVF6LCMRD35/k3vxp7cSAPrkRPac7NBihXcL21ZpUZM=
=34Wy
-----END PGP SIGNATURE-----
