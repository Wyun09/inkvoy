-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: node-tape
Binary: node-tape
Architecture: all
Version: 5.6.1+~cs8.20.19-3
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders: Bastien Roucariès <rouca@debian.org>, Ross Gammon <rosco2@ubuntu.com>
Homepage: https://github.com/ljharb/tape
Standards-Version: 4.6.1
Vcs-Browser: https://salsa.debian.org/js-team/node-tape
Vcs-Git: https://salsa.debian.org/js-team/node-tape.git
Testsuite: autopkgtest-pkg-nodejs
Build-Depends: debhelper-compat (= 13), dh-sequence-nodejs, node-concat-stream <!nocheck>, node-debbundle-es-to-primitive <!nocheck>, node-deep-equal (>= 2.0.5~) <!nocheck>, node-define-properties <!nocheck>, node-defined <!nocheck>, node-falafel <!nocheck>, node-function-bind <!nocheck>, node-glob <!nocheck>, node-inherits <!nocheck>, node-istanbul <!nocheck>, node-js-yaml <!nocheck>, node-minimist <!nocheck>, node-object-keys <!nocheck>, node-object-inspect <!nocheck>, node-resolve <!nocheck>, node-resumer <!nocheck>, node-tap-parser (>> 11.0.2+~cs2.1.4-2~) <!nocheck>, node-tap <!nocheck>, node-through <!nocheck>
Package-List:
 node-tape deb javascript optional arch=all
Checksums-Sha1:
 533942c9d15d523164c7dfb1c644e870019bad9e 11336 node-tape_5.6.1+~cs8.20.19.orig-array-prototype-every.tar.gz
 ec1eb3935ce43574e22b4e6c2aa6477f318d8258 2573 node-tape_5.6.1+~cs8.20.19.orig-dotignore.tar.gz
 9b97ecf274de8fd16337948b1ae3e6c05cf87b9d 4466 node-tape_5.6.1+~cs8.20.19.orig-for-each.tar.gz
 f950cf5794d00bbfed7936b9b26a98ed97e17554 7410 node-tape_5.6.1+~cs8.20.19.orig-has-dynamic-import.tar.gz
 4b1733166052dfc42e7f8f727085dad0be569d39 11168 node-tape_5.6.1+~cs8.20.19.orig-stringprototypetrim.tar.gz
 77215c065b1c7840da3ca5e061337bb4c7258122 3882 node-tape_5.6.1+~cs8.20.19.orig-types-tape.tar.gz
 bbe5bde541ac4a483daf6a6ab5371b361c74335f 88265 node-tape_5.6.1+~cs8.20.19.orig.tar.gz
 ff8ccb95e33f350c11975ddecff0aa540685b4d3 6400 node-tape_5.6.1+~cs8.20.19-3.debian.tar.xz
Checksums-Sha256:
 c7fd06c306ba6204ad84d2c52be39e56046b22b4e3c519d28221a037b230b5ff 11336 node-tape_5.6.1+~cs8.20.19.orig-array-prototype-every.tar.gz
 c59bbc34a8eb8d4b38137c1d0d4d9b79875f6f574a6afde2fa14c3374e2f2860 2573 node-tape_5.6.1+~cs8.20.19.orig-dotignore.tar.gz
 4b86c1bf7c2314b25b5b7d40c1186dddbe1469dad663b8402b352e9d90faebf6 4466 node-tape_5.6.1+~cs8.20.19.orig-for-each.tar.gz
 44568d32e48e9edc8717da24a415aa17cf4c16933421358e0c94b5c51c55dfd1 7410 node-tape_5.6.1+~cs8.20.19.orig-has-dynamic-import.tar.gz
 b8ae4e351e401d935d1d9045777353560ded686f465d0021aedd1c61eb73f3ff 11168 node-tape_5.6.1+~cs8.20.19.orig-stringprototypetrim.tar.gz
 fd2899d3ca0667651d0067f5580d72daeda4fbda662ff9528fcb013146d67fbf 3882 node-tape_5.6.1+~cs8.20.19.orig-types-tape.tar.gz
 b10572a9faf684ad860149fd9aabd8728367d2dcaece57664feb5d9503270fb8 88265 node-tape_5.6.1+~cs8.20.19.orig.tar.gz
 19be759be0a5fa766be00185b34f80404bacabc938add935ebf52b085f43a498 6400 node-tape_5.6.1+~cs8.20.19-3.debian.tar.xz
Files:
 f3e21d25d501db4ae7143c5f26596683 11336 node-tape_5.6.1+~cs8.20.19.orig-array-prototype-every.tar.gz
 e7d0bf237fbb576865dc0fcc538a5e3b 2573 node-tape_5.6.1+~cs8.20.19.orig-dotignore.tar.gz
 9120dbf4b95f8cdb8b21848c3aea8fbd 4466 node-tape_5.6.1+~cs8.20.19.orig-for-each.tar.gz
 275e7d7522bd77097cc9d4cfd6962d0d 7410 node-tape_5.6.1+~cs8.20.19.orig-has-dynamic-import.tar.gz
 779c2cab34dce8ff13277c693234f5e3 11168 node-tape_5.6.1+~cs8.20.19.orig-stringprototypetrim.tar.gz
 0a23482532b007669ea17a35ba8b7a73 3882 node-tape_5.6.1+~cs8.20.19.orig-types-tape.tar.gz
 94c41840dd2f791f95cfe2ab6eed3143 88265 node-tape_5.6.1+~cs8.20.19.orig.tar.gz
 08582e3da008beb4bff4c5aa3c19c861 6400 node-tape_5.6.1+~cs8.20.19-3.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQJGBAEBCAAwFiEEA8Tnq7iA9SQwbkgVZhHAXt0583QFAmfxJ8ASHGthcG91ZXJA
bWVsaXgub3JnAAoJEGYRwF7dOfN08vAP/0bBxxjGoXXpqPZO6QYXolVNtT01tTc0
j8qEI7Npup86FlYJaBZnN8uPiFxDkKYolx5wqZFibNmvLHVXqUEFi4DTy5eEBwmN
MqOUeXSGD9aw6rcymlPV4CCylUcEoLDuA1wNw1EwiLU0YIek2ccr0YhDYB9wJbql
peXuuqOhrkc+3m/lEyhs1S4/tyyPJyAwuwQ62DIDuYetdjIMEUrUG0r2IbZ4gW38
El3AWHk5fx3SG/s5TAdcueDCj8dcf9ifb4v9Qt3me0rKGZEEUubnPw5bwlJdlLA3
wlvWAwVhGXZhsEIVvi0uYPIatD6wrYPoGOP20GZTSCyBuNTEKElAOxnxYx2P7wSz
IYiROezdnc4kOm2dvbhQP4FU8vXZzeURZf/wGfHNMLfdVQ66+G+Qe2+4rA/V/gnN
ZiKScOCy7Gsrg3maGbIpfIgR7smoU3kk8DKBLaysoFxYFUiuBeWIN/4ztSHPdGRg
ht+H3gAyNWKxY7C6rz/99NrAH9yzBPsDmm+8LQBVEbCu2ly7vDUUxJywVv+h4zhG
SSSSsibGl1w6HurFSNe9k0JvoDcgqUn2WeXFxpvlb/LBlSo6elEBgTI5o8UbKT7o
qrOzt9H/F4EA3JbFqoQU1iT94sc0GDS63o8EAJoT9Vsv8B5ZUu2hj3mlubUEAypg
COlETdAVuL0J
=Ya6u
-----END PGP SIGNATURE-----
