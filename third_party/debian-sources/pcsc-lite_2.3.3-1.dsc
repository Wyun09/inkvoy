-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: pcsc-lite
Binary: pcscd, libpcsclite-dev, libpcsclite1
Architecture: any
Version: 2.3.3-1
Maintainer: Ludovic Rousseau <rousseau@debian.org>
Homepage: https://pcsclite.apdu.fr/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/pcsc-lite
Vcs-Git: https://salsa.debian.org/debian/pcsc-lite.git
Build-Depends: debhelper-compat (= 13), dh-exec, dh-sequence-runit, flex, libpolkit-gobject-1-dev, libsystemd-dev [linux-any], libudev-dev [linux-any], libusb-1.0-0-dev [!linux-any], meson, pkgconf, systemd-dev
Package-List:
 libpcsclite-dev deb libdevel optional arch=any
 libpcsclite1 deb libs optional arch=any
 pcscd deb misc optional arch=any
Checksums-Sha1:
 0984200070606547c26eec5cf9e0b3218a9c9ce3 210592 pcsc-lite_2.3.3.orig.tar.xz
 08a841474ed721ec9a2d1b187ed2112c5c4aa0d4 833 pcsc-lite_2.3.3.orig.tar.xz.asc
 3dcac9457cf2197c538097d5b77ad60b2cc77c63 20420 pcsc-lite_2.3.3-1.debian.tar.xz
Checksums-Sha256:
 cdff7d7153a0b37aa74e26dfec89ec7dc5c5286aa21b91b903e38739d227e8e7 210592 pcsc-lite_2.3.3.orig.tar.xz
 725840eeaff8d69a0410e4fd16a5b715a409a9c76c65a288b7b5e6422812d83e 833 pcsc-lite_2.3.3.orig.tar.xz.asc
 9026853375fc014f5d0052f5b6daf7f1d14e821e72f79d4f6c78ce1e3e1eb0e4 20420 pcsc-lite_2.3.3-1.debian.tar.xz
Files:
 b364c6495b1658218785be2e00f5052d 210592 pcsc-lite_2.3.3.orig.tar.xz
 d57ab2488301261f4fad0fcb237dd047 833 pcsc-lite_2.3.3.orig.tar.xz.asc
 cbed5e3d08d598e3f05a3570a5e28da3 20420 pcsc-lite_2.3.3-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQJIBAEBCgAyFiEE9eEbn/6REUb0HZU9eKG03+j5xX4FAmftX0YUHHJvdXNzZWF1
QGRlYmlhbi5vcmcACgkQeKG03+j5xX6XBg//bsougK41kNXbDLOub0LupQhCD31D
/30BZTibYOcxkL59FZJ/6d48Yls8x2l14zpfDVfdzZWzun5PuNkZ7w0jxEmxrrQH
o7towqoZycwssqVI2KGSkDn5otKMm2yVEMWhUAF2whK64foPLUmmUvnZPRJb9PFO
SDIWtnw2uRhxXl8aeZKanYSzFlZywWFl+WG3FlU3J1ookGxXADRPY8gX8I6e914V
xcV23adwcn/iaHzzSfoNB8OPXrM4vXysDgxemeOHocHJorP7nROsM4VCWnBtJq7e
+786osgG+kycUKP3HD211JzOIJiQBLi5Nn+4HIPoZbjs7bo9Zqa2eXzAaZxm53Ul
BgfmQ64FuF0dO4p6Ttdq2t8CM5l64WisxsgJeJWXKoTH2RKSV6yVTZYvoTeKt2ZS
esumPtniFRG4jri5bxCSeZLebdMieRxJ+jVmoTZ8GlkZySXiXOJM0K80Nu+w2J2w
zwP036YJA2Eb6ygKspUR9q3r4z41nBPbMi1AMMzMLFZmCmv/PoyZ0ed8mhheyJkc
fyBoB3sDyxQljsNw86UZhWoER9zX5xWCQbvfBKOmzHM1x4uJvJGaPyyNvOZTWwmB
0x2tQ7qPYotcD8gDDrpD+tmReBuCqR8ywHZdJouOyqquBN+zwK+rzSKuofEsJTg5
cU6ZEUrsrfDSer8=
=DpZy
-----END PGP SIGNATURE-----
