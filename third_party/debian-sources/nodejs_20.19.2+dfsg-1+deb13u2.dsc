-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: nodejs
Binary: libnode-dev, nodejs, libnode115, nodejs-doc
Architecture: amd64 arm64 armel armhf i386 mips64el mips64r6el loong64 powerpc ppc64 ppc64el riscv64 s390x all
Version: 20.19.2+dfsg-1+deb13u2
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@alioth-lists.debian.net>
Uploaders: Jérémy Lal <kapouer@melix.org>, Jonas Smedegaard <dr@jones.dk>
Homepage: https://nodejs.org/
Standards-Version: 4.7.2
Vcs-Browser: https://salsa.debian.org/js-team/nodejs/tree/master-20.x
Vcs-Git: https://salsa.debian.org/js-team/nodejs.git -b master-20.x
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, ca-certificates, curl, procps, python3
Build-Depends: sse2-support [i386] <!nocheck>, armv6k-support [armel] <!nocheck>, vfpv2-support [armel] <!nocheck>, debhelper-compat (= 13), dh-buildinfo, bash-completion, dh-sequence-bash-completion, ca-certificates, curl <!nocheck>, gyp (>= 0.16.0~), jq, libbrotli-dev, libbrotli-dev:native, libc-ares-dev (>= 1.18.1~), libc-ares-dev:native, libhttp-parser-dev (>= 2.9.2~), libicu-dev (>= 70.1~), libicu-dev:native, libnghttp2-dev (>= 1.41.0~), libnghttp2-dev:native, libnghttp3-dev (>= 1.4.0~), libnghttp3-dev:native, libngtcp2-dev (>= 1.6.0~), libngtcp2-dev:native, libsimdjson-dev (>= 3.10.1~), libsimdjson-dev:native, libssl-dev (>= 1.1.1~), libssl-dev:native, libuv1-dev (>= 1.43.0~), libuv1-dev:native, node-acorn (>= 6.2.1~) <!pkg.nodejs.nobuiltin>, node-cjs-module-lexer (>= 1.2.2~) <!pkg.nodejs.nobuiltin>, node-minimatch (>= 9.0.3-5) <!pkg.nodejs.nobuiltin>, node-undici (>= 5.0.0~) <!pkg.nodejs.nobuiltin>, openssl (>= 1.1.1~) <!nocheck>, pkgconf, pkg-js-tools (>= 0.8.2~) <!nocheck>, python3:native, python3-packaging, procps <!nocheck>, zlib1g-dev, zlib1g-dev:native
Build-Depends-Indep: node-js-yaml (>= 4.1.0+dfsg+~4.0.5-6) <!nodoc>, node-marked (>= 4~) <!nodoc>, node-highlight.js <!nodoc>
Package-List:
 libnode-dev deb libdevel optional arch=amd64,arm64,armel,armhf,i386,mips64el,mips64r6el,loong64,powerpc,ppc64,ppc64el,riscv64,s390x
 libnode115 deb libs optional arch=amd64,arm64,armel,armhf,i386,mips64el,mips64r6el,loong64,powerpc,ppc64,ppc64el,riscv64,s390x
 nodejs deb javascript optional arch=amd64,arm64,armel,armhf,i386,mips64el,mips64r6el,loong64,powerpc,ppc64,ppc64el,riscv64,s390x
 nodejs-doc deb doc optional arch=all
Checksums-Sha1:
 36d594cccc87915a298fccaa4f30843f6a7af2ec 274900 nodejs_20.19.2+dfsg.orig-ada.tar.xz
 c3753ad4a19367bb34d4b34d6f28276b8a139038 303700 nodejs_20.19.2+dfsg.orig-types-node.tar.xz
 7ed7a340dc165334953d0a57eb4c2600e4d3081a 19886184 nodejs_20.19.2+dfsg.orig.tar.xz
 b4cfc4f31a57aa141ac6f4acf12fd1f2bce56b76 203392 nodejs_20.19.2+dfsg-1+deb13u2.debian.tar.xz
Checksums-Sha256:
 26deff017c505b316f2498aaf293c896f4ab92b5349b367cf21fe14fa2cbd1e1 274900 nodejs_20.19.2+dfsg.orig-ada.tar.xz
 cacb4b47fe0ad9250294545a33e5097c50b0a86f7bd1862cd73f99385f69a174 303700 nodejs_20.19.2+dfsg.orig-types-node.tar.xz
 5e5559381ad031d245a8efa403458abbb73755f74c3e6380f185a4dd342b7949 19886184 nodejs_20.19.2+dfsg.orig.tar.xz
 a13e879865bd61c698ad6fdeeb4b18bef46c7a6f6ce5921c70a0f97eb05e266c 203392 nodejs_20.19.2+dfsg-1+deb13u2.debian.tar.xz
Files:
 fd9ff3be8b8b43905dd24c5af24aab16 274900 nodejs_20.19.2+dfsg.orig-ada.tar.xz
 a1bc896abb59372639fc59c82e40a517 303700 nodejs_20.19.2+dfsg.orig-types-node.tar.xz
 8b4b3615193af364ccde831591e81402 19886184 nodejs_20.19.2+dfsg.orig.tar.xz
 1ba8a615a4a881221e9e8d136189d381 203392 nodejs_20.19.2+dfsg-1+deb13u2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQJGBAEBCAAwFiEEA8Tnq7iA9SQwbkgVZhHAXt0583QFAmnC/hkSHGthcG91ZXJA
bWVsaXgub3JnAAoJEGYRwF7dOfN0LjMP+wVz3mgr55e9ZqGM4KJ32l9gmHooMaAw
CfHwKqqE8NoX25pdeTWdIKSryo1tKctqkb+z2dGzultAx79yhx7JKm5gc22F6MYk
S4zWb3JG9kFc4/sj/nX1KnveZM/2IAytGo1zrm6ICMYdM9Hs/QDhDgxJ8OKd7aXa
JRp0GBZsmhXBudZ8gAuiXH36ZHfIUgmdzCzMN6OFR7ult1VpEk9nS2ynCDSA/SS1
j3DLyhN54FZOXBrY6e0sMaiTy1AUAx/ri+XDI9jPAdMScz7jhyC++eDpX7W5TJd3
zsRSgRUZnGbzI3CXh2kI/x5UwlhGejhDhYclBTrcddqFr+E/sLm7IJRnS5ra4IL8
7zYKN/24S0cNLdVK6lO6itvcp90/34q5XIJhWmxkiVGlqqAHsDiRvGSXhwSDCekH
5VfatJQJBylok5IOX09WK3qpxbsUrQNP/a7mIvR4lfLmL3J8W9dQHl3yFeEZJ6s/
H6K5FyWvnjN8I0L5AsGPZI5itVlcAsfbtRfbWabng0jINvbI3FuQTzKJ494lGkhE
a//3py9KxifMoo+kvnqkb8Zy5DoNb+OV2xIAVQyQ/de3sThlbL89FoAP7VvVEiyy
XHbsTxsjiZEFOrYcvxT2SAW2x5OJHVeODqMB1vuT2b7JS/YEn+lAIZp0qSQ3XuJu
kUH5PAs9jTFs
=7W67
-----END PGP SIGNATURE-----
