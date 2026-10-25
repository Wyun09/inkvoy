-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: acorn
Binary: node-acorn, node-debbundle-acorn
Architecture: all
Version: 8.8.1+ds+~cs25.17.7-2
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders: Bastien Roucariès <rouca@debian.org>
Homepage: https://github.com/ternjs/acorn/
Standards-Version: 4.6.1
Vcs-Browser: https://salsa.debian.org/js-team/acorn
Vcs-Git: https://salsa.debian.org/js-team/acorn.git
Testsuite: autopkgtest, autopkgtest-pkg-nodejs
Testsuite-Triggers: libjson-perl, nodejs
Build-Depends: debhelper-compat (= 13), dh-sequence-nodejs (>= 0.14.5~), docbook2x <!nodoc>, jdupes, mocha <!nocheck>, node-ast-types, node-babel7, node-graceful-fs, node-mkdirp, node-rollup-plugin-babel (>= 4.4~), node-rollup-plugin-buble, node-tap <!nocheck>, node-tape <!nocheck>, node-unicode-lastest, node-xtend <!nocheck>, nodejs:native | nodejs (<< 12.22.5~dfsg-4~), rollup
Package-List:
 node-acorn deb javascript optional arch=all
 node-debbundle-acorn deb oldlibs optional arch=all
Checksums-Sha1:
 ffa5e547e8b2f2223ce08ecb88728a04190df45c 3668 acorn_8.8.1+ds+~cs25.17.7.orig-acorn-import-assertions.tar.xz
 75dcd0421d834677ba07bed5d2636da835973940 5904 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-bigint.tar.xz
 f6312d0a62b0e505f71ffb2863691666398235ee 6800 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-class-fields.tar.xz
 fd38ee4bc2ea800b766f0544069bf5b37f8c7db2 36408 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-dynamic-import.tar.xz
 c9956a1fe25a4598274166efc1ba0fd3f7e290c8 5048 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-export-ns-from.tar.xz
 2560ea32b12171f0a8faa345aacc9238c86e1a6f 6772 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-globals.tar.xz
 6671e909b59676839113912d568070f01dbb6b89 5848 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-import-meta.tar.xz
 eb81fcb88fb777b83f69a36f8db446fe06875f63 9136 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-jsx.tar.xz
 ad8fca61d301f58dc8f818f2aab81722824cfb61 5792 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-node.tar.xz
 c9538c2a037f0ba12e876e3341a71929eb1913d9 7032 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-numeric-separator.tar.xz
 2871ab7cbf2a72cea581ca9f0e56e52054415bc7 5588 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-private-class-elements.tar.xz
 a08ccb0f8e756f7d25250c0d45859e2f8e65325b 6312 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-private-methods.tar.xz
 d3e432813cb55752414c4b39ee106b41dd8de3ba 6800 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-static-class-features.tar.xz
 73b559e73aba28d4b4d15eb457f1929723673ab0 148440 acorn_8.8.1+ds+~cs25.17.7.orig.tar.xz
 58b49046bdcdb0ea9aaf9aaa92b439436578e3dd 16632 acorn_8.8.1+ds+~cs25.17.7-2.debian.tar.xz
Checksums-Sha256:
 2f4abf0259b4df7e5b8aa2a3757b0f7b598324a57a017ae1a48dadf8aabda891 3668 acorn_8.8.1+ds+~cs25.17.7.orig-acorn-import-assertions.tar.xz
 69a193438d1feac6f09526fd500dc8b000eaa5c1e61d487f819b333a1699f50b 5904 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-bigint.tar.xz
 892fd7fa31243d0f8d4927b3d1a3b49d7547d24545a4f3fe35be6e46f2e39075 6800 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-class-fields.tar.xz
 5d73f36f3c460963e5d5168de14020e4edc70e1a4a5ddbb1c37035e39aff9799 36408 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-dynamic-import.tar.xz
 0d83d3cb98392d9117f254acd10ed047de5b44facfbb1e8754965a39e77efb3b 5048 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-export-ns-from.tar.xz
 4e7a3b13cc4095feca9d67748707f5acea09ae24533b66edd9b215cd932afcde 6772 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-globals.tar.xz
 c4cbc6b046d63a72aa1e5022e432868de18b571487009bc853fd0fa8693001cd 5848 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-import-meta.tar.xz
 0f3c007ce5626b71dd608f7e97ae02d6b114143607e47ac9d66ceae50f9cffc3 9136 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-jsx.tar.xz
 1639775ebf801b005592f6bb0fc713d1463ff5332e8bdb0ef993e491f274d132 5792 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-node.tar.xz
 39072a17ebb5c6eb3714202bfcbec8b32bccdb3f0ad5ffbf493691eb8d035378 7032 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-numeric-separator.tar.xz
 2e6081516c3a244b79d6865e4795fabc00987999c62aa81a1313fa8c1947d47f 5588 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-private-class-elements.tar.xz
 c757b47c125be7eb5cdd0fcc834bad22b80776617e91a9a5c7036463471730e5 6312 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-private-methods.tar.xz
 626b10b85aeb1a92501e23e8c237a15bee03fc02a93026ce7cf9418699211133 6800 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-static-class-features.tar.xz
 4821469ea74e99c56dac155de9b1d503e5f83c52ca47cafada62bbd6c7d4da9a 148440 acorn_8.8.1+ds+~cs25.17.7.orig.tar.xz
 76b42517d87b17effdc5daaf5396416b73536e5ffd59fea7c5e696f92ce5b390 16632 acorn_8.8.1+ds+~cs25.17.7-2.debian.tar.xz
Files:
 666a3aa22717ecf592344aa298005a71 3668 acorn_8.8.1+ds+~cs25.17.7.orig-acorn-import-assertions.tar.xz
 4647e885ba6d9efbd3737f9efc7308dc 5904 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-bigint.tar.xz
 cd0cab49b22c6eb4fc8c1b79928fa972 6800 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-class-fields.tar.xz
 27a5450f6ff18a5f51274ae1168b87f3 36408 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-dynamic-import.tar.xz
 8af195fd789c2da7216c482c96e87734 5048 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-export-ns-from.tar.xz
 caff655205c6acf528671587385201a3 6772 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-globals.tar.xz
 83aff9e555ad789d692a8591ea6a920e 5848 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-import-meta.tar.xz
 d2fefb850c8d56857336dc91350a6ae8 9136 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-jsx.tar.xz
 d1fe24e9a3b023b5f7a635d0b68dc627 5792 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-node.tar.xz
 7896b0b277a4c8fdc31e25c55e2d166b 7032 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-numeric-separator.tar.xz
 a59c68ce187d698c88d3b6085db5712a 5588 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-private-class-elements.tar.xz
 8814f837c20d69b9b1ecfa5bb356230c 6312 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-private-methods.tar.xz
 9cea4bb613d989a0e8f3292bf07cb056 6800 acorn_8.8.1+ds+~cs25.17.7.orig-node-acorn-static-class-features.tar.xz
 98599aff199377c32da09f30987fa4d7 148440 acorn_8.8.1+ds+~cs25.17.7.orig.tar.xz
 71710a4a129fd9be7d7ff2bb5516905b 16632 acorn_8.8.1+ds+~cs25.17.7-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEAN/li4tVV3nRAF7J9tdMp8mZ7ukFAmNsmxEACgkQ9tdMp8mZ
7ukTyw//QDxzazf6d/VntO6XspMEMAuQIf8Us/Ad1Q3Xyd1ybT1E2ycZNLvlXrOL
B3q5SxPkMkopcXudloP9we6P6E8VBwGQMvh1qBz0X1EbFrx6Ndg2ea2hOA5oPjHv
msVF0AgWul+ZR97kcF5yxVQsXZof+vlbmNxaQKRmL7vuvRfesdCCEoiI0+rpjYUg
bznBnwQSRLSfokc1ZWgFqECuS12J2mpgGXyc1hv4TH6tR15AH6lJZl9nJF8K/mEl
sqF7OwrK24kgNDbp5fcmpG0lV9iK5KY20lS/Q+dIjFNDm9mtmpxCiTvLO8VtTny6
XiDxbpcS1Cn4amsv6w2r3hnXfql79aEJu4L/z7unEcG0Y3dft76AadffhaBKhPzR
s0stDaXaa4mRdUxjKfSZTDh+xHS+cWnVhN0vtXQl4ks1Ogf3cQgimqbVTz3y9oug
N95f3H7O87PH+HvqI5+xip0xEWDGUpnc/ROxcNE6gcxqax6Rb1uysH6VNCYXIrjc
6eNLtbObO3XN4pvCW2AzuOLL1iIphECrJDK4SBs9/rLPwkUy4B+FDzqeePC3CnUk
iOxqmi0TXjjinSxVdIi2tg/icfCV6f65M8sS4c+90Z9CCYnpZyAl8A13EcTCxtBO
SpZpyaVNIkJGJ68m7fQotEULSkOMvEY86brmn4M8+3JtLgiOnmI=
=Zoe0
-----END PGP SIGNATURE-----
