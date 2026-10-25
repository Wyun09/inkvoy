-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: node-glob
Binary: node-glob
Architecture: all
Version: 8.1.0+~cs8.5.15-1
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders: David Paleino <dapal@debian.org>, Jérémy Lal <kapouer@melix.org>
Homepage: https://github.com/isaacs/node-glob
Standards-Version: 4.6.2
Vcs-Browser: https://salsa.debian.org/js-team/node-glob
Vcs-Git: https://salsa.debian.org/js-team/node-glob.git
Testsuite: autopkgtest
Testsuite-Triggers: @builddeps@, nodejs, pkg-js-autopkgtest
Build-Depends: debhelper-compat (= 13), dh-sequence-nodejs, node-fs.realpath <!nocheck>, node-inflight <!nocheck>, node-inherits <!nocheck>, node-minimatch (>= 9) <!nocheck>, node-memfs <!nocheck>, node-mkdirp (>= 1) <!nocheck>, node-once <!nocheck>, node-rimraf <!nocheck>, node-tap <!nocheck>
Package-List:
 node-glob deb javascript optional arch=all
Checksums-Sha1:
 a99f249f88930392aa342c0a806114f12431b3c6 10130 node-glob_8.1.0+~cs8.5.15.orig-globalyzer.tar.gz
 d9c4f7e4f714eccd053563f51193d166875ce4ad 30336 node-glob_8.1.0+~cs8.5.15.orig-globrex.tar.gz
 7242111800d556957a0a00c1b49b8e060ad2f22e 29512 node-glob_8.1.0+~cs8.5.15.orig-tiny-glob.tar.gz
 b63e70155391b0584dce44e7ea25190bbc38f2fc 2410 node-glob_8.1.0+~cs8.5.15.orig-types-glob.tar.gz
 cec9a7616381d1affca4743fafeaf4900444dd5d 991452 node-glob_8.1.0+~cs8.5.15.orig.tar.gz
 5a97184ec8aba028adb5eaea3d610947442af8be 11916 node-glob_8.1.0+~cs8.5.15-1.debian.tar.xz
Checksums-Sha256:
 16d1cbc2518f9d2caa8827078e3a82aeec98563609059ddb4e164965e92a2722 10130 node-glob_8.1.0+~cs8.5.15.orig-globalyzer.tar.gz
 b39debaf5d90ec0a23aac5c2db0eae11bde8c167761be007bd31bd80c59feb0c 30336 node-glob_8.1.0+~cs8.5.15.orig-globrex.tar.gz
 26837f51b3d5bad0b8b235f0fbaa800d4b18069de4b6280164422eba9ce76a78 29512 node-glob_8.1.0+~cs8.5.15.orig-tiny-glob.tar.gz
 15aaa9f5b0e393fbdeb85651c8bbaf694970f6f82615c7d5302e7c15f5e4270c 2410 node-glob_8.1.0+~cs8.5.15.orig-types-glob.tar.gz
 8d76d3374eefb4806ba397b40294013afd42045bc42976dad1e25b46a1c8d826 991452 node-glob_8.1.0+~cs8.5.15.orig.tar.gz
 9e7b233309923a2b079099188d61fe0514185deb7a6dc6f3f52d15efc6003c4e 11916 node-glob_8.1.0+~cs8.5.15-1.debian.tar.xz
Files:
 f287e45b356cf8c0ee076c50370de7f4 10130 node-glob_8.1.0+~cs8.5.15.orig-globalyzer.tar.gz
 04398ae071a259bfa5d34de67e2677a5 30336 node-glob_8.1.0+~cs8.5.15.orig-globrex.tar.gz
 8b2127cd88200f83e2264d0ca413c6b9 29512 node-glob_8.1.0+~cs8.5.15.orig-tiny-glob.tar.gz
 96748631058149de069dbc6be2af7ecb 2410 node-glob_8.1.0+~cs8.5.15.orig-types-glob.tar.gz
 589f2e36a6364a367bdfc5c7cd1ec3fd 991452 node-glob_8.1.0+~cs8.5.15.orig.tar.gz
 20ead15c810bad0828ec9f6095b0979a 11916 node-glob_8.1.0+~cs8.5.15-1.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEAN/li4tVV3nRAF7J9tdMp8mZ7ukFAmWFYXoACgkQ9tdMp8mZ
7umMDg/+IFjqy9EUM/c8VnZfElpQLdME0j67NJj3GaWLCViTZMYp5N3g4cX+FtvD
kP1hGVBNGjRCcLs0dlNc1/2KLb29HxOv5BdnJCmhzIG5Fwwin2UsLa5L2IRuSLe/
NDAuIXoBSFZr5zC1nJgHV79sZCcz4sA6lvIHv1KNujFm09ggJaYMVr/i7q+AQC98
AvevhdWX6874tixvTtxKXINdUdfL4YZRpeKp7webgZdMQkmOzmRZyw8VYPcA2L4Q
59DPCVl4cul1w7CjTwbxBXAvfM7n6enwzff1RK3Y+H5xkF0QhsWblQ59Xbgy2uBR
ce0wjfVfbha/XfEJuxl6x79KjFPAKXQV6HzvPu/AGpxq3HClExSv/VIHfoqEUujb
Ty3nXjR5X3jEtlcAOvACB9/JOPzF0cpXfJr1vb2d0N39TIw8KTgjjsF8uFM8i/On
KIrfrgtvWn+iAnMbXcdWnVZ8TgQrOZ4DmKAfSP8H8ozI98ot2EKPmkYV6SzefQ9K
SZNjp8vJQIkUWShMUwX57FIL3I64rv7RjkGkat//T0GtVGWHh5eupfu75JlBYAqM
fSxbkQkZ8EHvlaCgLo2KnAFaFIgSCPLc29zQHWcAUL9qxiiRgY9VSA6Y+WgTUuDd
sYSUV25f2f/MXFi4HqXvd5uGtJx1Jx/YJD1ouVAGN1TP7OzZxPM=
=f1Aw
-----END PGP SIGNATURE-----
