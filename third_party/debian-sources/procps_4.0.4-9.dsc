-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: procps
Binary: procps, libproc2-0, libproc2-dev
Architecture: any
Version: 2:4.0.4-9
Maintainer: Craig Small <csmall@debian.org>
Homepage: https://gitlab.com/procps-ng/procps
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/debian/procps
Vcs-Git: https://salsa.debian.org/debian/procps.git
Testsuite: autopkgtest
Testsuite-Triggers: shunit2
Build-Depends: debhelper-compat (= 13), dh-exec (>= 0.3), libncurses-dev, dejagnu, libnuma-dev [amd64 i386 ia64 mips mipsel mips64 mips64el powerpc ppc64el], pkgconf, libsystemd-dev [linux-any]
Package-List:
 libproc2-0 deb libs optional arch=any
 libproc2-dev deb libdevel optional arch=any
 procps deb admin important arch=any
Checksums-Sha1:
 2b859acd7060e9898ac457dbd26dbebf563cc44b 1401540 procps_4.0.4.orig.tar.xz
 d0129f2f423db17a6012bf90e17a0f3e1f25274e 45932 procps_4.0.4-9.debian.tar.xz
Checksums-Sha256:
 22870d6feb2478adb617ce4f09a787addaf2d260c5a8aa7b17d889a962c5e42e 1401540 procps_4.0.4.orig.tar.xz
 4821ca009f83b05522bc97ddac82661898938323ef0808416bca7830ce19bd97 45932 procps_4.0.4-9.debian.tar.xz
Files:
 2f747fc7df8ccf402d03e375c565cf96 1401540 procps_4.0.4.orig.tar.xz
 0ca4994349f1c4b5e089073736de21d4 45932 procps_4.0.4-9.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEXT3w9TizJ8CqeneiAiFmwP88hOMFAmiKCToACgkQAiFmwP88
hOOMDhAAptmSpt/iwo267DWOHmR8C+PIbc6oaJp9MxRp0KbGv+Q6eYEPbbWbscgS
tbbMlLRJSZh1OFkxh+HvadG+ZorWB/q5ov8cuUiJUSbQ6MXAnUQnPBj0uq/d+Hth
gMB91wscBRrYYAvIId5b+03T9wLzsONSyzYvhswwCITbGIHiezMyDdGoFWWpQGVG
JyMsk3pO+uf9uWRxq9Ab/2Zf/V5e2SvW/WVFy7DEX201/KpjgftmzS7+fTuTwGec
JUJmxKESHVJeP7CtEfNm59QmKAZSZDT1YLaLAHkVwQnbu2x4vqvUl9Y3BnEhZZEa
emGp16+vglg1FXIWJgqc/NBuYZrzuh5HBkx64RnNo8o1DdLcqVaZmDgsSgErAC8p
V3/MlfCkHnE/TodtwT1CI2BzxAL4w4MIk4GaOBVfVAUqaEatuiVo4d76jekmJ9q8
EXtBt2xUhRJlGjc1PIrVHltSwD69/MbD9h5Eq16kzRApt7YsP5FDsxjEw5mRPaOk
/xTpJZRweMMJQ75Z9CtpKlRSxFQEoulWlc1j4hb0rzW7dawBdcmHb177slmLctfi
nMApVTYZrs8RwmyO4rXCbHREl5xl4QYkBQAZvSOoFkSYOE7roiwe3177h2tRlfC9
MnySJB+rs8aWB/PqUr41tiEps3qPX5RmehQX8ryq2adDrKfhE1w=
=C9E+
-----END PGP SIGNATURE-----
