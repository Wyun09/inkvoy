-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: sysvinit
Binary: sysvinit-core, sysvinit-utils, sysv-rc, initscripts, bootlogd
Architecture: any all
Version: 3.14-4
Maintainer: Debian sysvinit maintainers <debian-init-diversity@chiark.greenend.org.uk>
Uploaders:  Ian Jackson <ijackson@chiark.greenend.org.uk>, Benda Xu <heroxbd@gentoo.org>, Adam Borowski <kilobyte@angband.pl>, Vincenzo (KatolaZ) Nicosia <katolaz@freaknet.org>, Mark Hindley <leepen@debian.org>,
Homepage: https://github.com/slicer69/sysvinit
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/debian/sysvinit
Vcs-Git: https://salsa.debian.org/debian/sysvinit.git
Build-Depends: debhelper-compat (= 13), libcrypt-dev, libselinux1-dev [linux-any], po4a
Package-List:
 bootlogd deb admin optional arch=any
 initscripts deb admin optional arch=all
 sysv-rc deb admin optional arch=all
 sysvinit-core deb admin optional arch=any protected=yes
 sysvinit-utils deb admin required arch=any essential=yes
Checksums-Sha1:
 23f55970b5e4fbd904934845950713a43d76ba07 516357 sysvinit_3.14.orig.tar.gz
 03d7606ab74829d04a9db953e2151c15b4391ca4 122156 sysvinit_3.14-4.debian.tar.xz
Checksums-Sha256:
 4e90a148707cf64113fc97343c053f9c0c9589551936b053999dcc69731f295f 516357 sysvinit_3.14.orig.tar.gz
 2ba0aa763232112696bce50ee5acc707a515fcbd5b2c194193bfa7a0a525bff6 122156 sysvinit_3.14-4.debian.tar.xz
Files:
 06e98339422bd20c8d7609fd5de29665 516357 sysvinit_3.14.orig.tar.gz
 9d96c16f99794ff571d29e2a76b67cb3 122156 sysvinit_3.14-4.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCAAdFiEEUGwVpCsK9aCoVCPu0opFvzKH1kkFAmfQofwACgkQ0opFvzKH
1kkXvg//UgQ5BAAIDy8YMhKOq1ysprKuKI4sNA6nH2MvAQxDLLCAPuCa3hUlZ0SA
474rYq9UZ4uqiOlDUJJxZldZC3OtpYEF7fn9AqAxvZ+OcCMaER68auNR4lN2titj
lWmVBtFLfiDhmT2/lY+x18OznDZVntnKg8GjkbELyN8MEHg9jik7fNUUlFbcTsZT
4rnkVbapgb5Fa0986jNysekXqpM1rImGSOe5kOQAIoOnCHbZxRV6fVgqtjBcNLMI
gVL71bsmIy2JQd1yggLfnYIs05w8BrpxTPLYDkDml1mdxWqCEe3zgcvVX+XYog++
uRNc4Tr7Eho/4ETt+493LAo8OlNuwZs2/0akwNjniS3Lsg9LQ96oUwtyfl1+2n3Y
YVOusdUgeVpxY/wktkEmvUUZjpIMICD+4+fhcb7O+XQ4h6MdxNLFq/HPnGYLu1SD
28dGvodVvs8yKTPTltJYL7AWuRwosVk6J5mURUsJD4u07z/NKWcgWf0FbkBwlyxL
eRT6fueBMNv7U/uXldJP+rK6y8o5+AfOg6uDMdQy2whAT67lY7iBbtgVriQlG/TH
zTInwOl6ABacAP+xnjR7jCbOn8T1G/MV7TwasXq322k+h4TAdUGSGEsoflo05GcO
NQJuC2IBNdv0erOCz8tntjVeY6Fsac3Hgvhe1eR4BbD9eS/1kUM=
=jiZp
-----END PGP SIGNATURE-----
