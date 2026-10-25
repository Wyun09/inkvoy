-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: vim
Binary: vim-common, vim-gui-common, vim-runtime, vim-doc, vim-tiny, vim, vim-gtk3, vim-nox, vim-motif, vim-athena, xxd
Architecture: any all
Version: 2:9.1.1230-2
Maintainer: Debian Vim Maintainers <team+vim@tracker.debian.org>
Uploaders: James McCoy <jamessan@debian.org>,
Homepage: https://www.vim.org/
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/vim-team/vim
Vcs-Git: https://salsa.debian.org/vim-team/vim.git
Testsuite: autopkgtest
Testsuite-Triggers: lua5.1, perl, python3, ruby
Build-Depends: autoconf, cscope <!nocheck>, debhelper-compat (= 13), libacl1-dev, libcanberra-dev, libgpmg1-dev [linux-any], libgtk-3-dev, liblua5.1-dev, libmotif-dev, libperl-dev, libselinux1-dev [linux-any], libsodium-dev, libncurses-dev, libtool-bin <!nocheck>, locales-all <!nocheck>, lua5.1, ncurses-term <!nocheck>, procps <!nocheck>, python3-dev, ruby [!alpha !ia64] <!pkg.vim.noruby>, ruby-dev [!alpha !ia64] <!pkg.vim.noruby>, tcl-dev
Build-Depends-Indep: docbook-utils, docbook-xml, ghostscript, lynx, pdf2svg
Build-Conflicts: autoconf2.13
Package-List:
 vim deb editors optional arch=any
 vim-athena deb oldlibs optional arch=all
 vim-common deb editors important arch=all
 vim-doc deb doc optional arch=all
 vim-gtk3 deb editors optional arch=any
 vim-gui-common deb editors optional arch=all
 vim-motif deb editors optional arch=any
 vim-nox deb editors optional arch=any
 vim-runtime deb editors optional arch=all
 vim-tiny deb editors important arch=any
 xxd deb editors optional arch=any
Checksums-Sha1:
 5791f48be554abc98765f7b665f4d65913450326 12331388 vim_9.1.1230.orig.tar.xz
 abbba21e194cbfdd34786955083aa45415ebe98b 191956 vim_9.1.1230-2.debian.tar.xz
Checksums-Sha256:
 203640cca8fa97603868ef42f34eeb723803ab15fd141b68b1cba54b7993b2bf 12331388 vim_9.1.1230.orig.tar.xz
 3f06690fe44914764a260531d71f9bf63d58c9156b86660bd323dd0e7038898d 191956 vim_9.1.1230-2.debian.tar.xz
Files:
 a81348a668d6bbe6dbaa5774af88626e 12331388 vim_9.1.1230.orig.tar.xz
 d2a1b6d5d581ddbc7f4c24aacb112f3e 191956 vim_9.1.1230-2.debian.tar.xz
Dgit: a0b7e385ee0585e8cf9d3dbb1f2586b26fa593d8 debian archive/debian/2%9.1.1230-2 https://git.dgit.debian.org/vim

-----BEGIN PGP SIGNATURE-----

iQKoBAEBCgCSFiEEkb+/TWlWvV33ty0j3+aRrjMbo9sFAmgvxzBfFIAAAAAALgAo
aXNzdWVyLWZwckBub3RhdGlvbnMub3BlbnBncC5maWZ0aGhvcnNlbWFuLm5ldDkx
QkZCRjRENjk1NkJENURGN0I3MkQyM0RGRTY5MUFFMzMxQkEzREIUHGphbWVzc2Fu
QGRlYmlhbi5vcmcACgkQ3+aRrjMbo9v0JQ//WDml3ekIqWaHSCCWxzIczFebQ7km
pVssiGPKVVGsDQTLDKF/PvnVAmpuaBr9Jx3YwYxC+TnuMAg9qgRy6hMaRX9g5DwP
ks3ESj6/X8V2HUtbs+3gzk4xQRJA0iBnYuUOZgFjGSt4hSDA2WclmDrJPKUFyD8M
6Zl6LO5jZfDaEwiUuBIFp5v4P5lBsXe1ePnGeJZrkJi9TJsreX4/GJbmuIBewauJ
lM3bCzuDkk7tin7ZOf8KLgaMGzjFlQW0hppFIVyT2jV5s84wmZ+tYP/CKQ7DCbpm
JcR+P0gXDSEZ52wSFivhsSu4Utf0qYKD24+NYhnB0IMsNeecHeZRFWRiTJsMZKcu
yxalatfslmhn5LjFvl0oJIfR1hX65FRlOV6wb8cHb/avwctTPdJcMp2egRbWl2lB
tJJx0A9CvrQTmqQhwZR65snNPaXDjlExfZ+WjSF2GFoaE8Ov3fPW1VsED5bZIm3J
pD7AX6U+Nw+i2gOfzO+80fyxqmMapM7Bfn+zF3BVMATkgw3wJ+qHUujXp4BL+5id
JQgWKRuEGSYSCHkzAEfW5iM6qGuOcaZAdyPrAFKHH80vv403jZ9MisLEZE1XJXAO
swzyt8cE0LCEvsFgAdwKXduyNhS0AaUjOdwHIV5zfMBEfLTize8Di0jdwUrNuXzC
0LCUSot55ziz6Bs=
=yEvA
-----END PGP SIGNATURE-----
