-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: node-minipass
Binary: node-minipass
Architecture: all
Version: 5.0.0+~cs10.3.21-3
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders: Yadd <yadd@debian.org>
Homepage: https://github.com/isaacs/minipass
Standards-Version: 4.6.2
Vcs-Browser: https://salsa.debian.org/js-team/node-minipass
Vcs-Git: https://salsa.debian.org/js-team/node-minipass.git
Testsuite: autopkgtest-pkg-nodejs
Build-Depends: debhelper-compat (= 13), dh-sequence-nodejs, dh-nodejs, node-encoding <!nocheck>, node-end-of-stream <!nocheck>, node-jsonparse <!nocheck>, node-jsonstream <!nocheck>, node-tap (>> 16.3.7+ds1+~cs50.9.19-7~) <!nocheck>, node-through2 <!nocheck>, node-yallist (>= 4.0.0) <!nocheck>, node-form-data <!nocheck>
Package-List:
 node-minipass deb javascript optional arch=all
Checksums-Sha1:
 959df5de07c1c43f74d8a3907a1a1267d6da9ed1 30408 node-minipass_5.0.0+~cs10.3.21.orig-minipass-collect.tar.gz
 8d07dd9f2ec8037f2ae8c9f259b0c6c9235484e9 50330 node-minipass_5.0.0+~cs10.3.21.orig-minipass-fetch.tar.gz
 831bab9186a40faa2d0cb2a540047f4c946b63e5 30671 node-minipass_5.0.0+~cs10.3.21.orig-minipass-flush.tar.gz
 d5adfa7f47bdfda6f87160cf6f1d1b62d64876d4 39556 node-minipass_5.0.0+~cs10.3.21.orig-minipass-json-stream.tar.gz
 1fb12c8385de189810cdf8e0703e962af3b57591 32921 node-minipass_5.0.0+~cs10.3.21.orig-minipass-pipeline.tar.gz
 bae429587d31447355316859c2272d20c4cbd61b 30904 node-minipass_5.0.0+~cs10.3.21.orig-minipass-sized.tar.gz
 e17f067b0a6d2f044acc5102889470446bf3d3d6 186669 node-minipass_5.0.0+~cs10.3.21.orig-minizlib.tar.gz
 77e2db216c14ab52a03f6066ca1c99237795b24b 86487 node-minipass_5.0.0+~cs10.3.21.orig.tar.gz
 48621f1df5cdb77b8b62e9c163290783c40425e2 22396 node-minipass_5.0.0+~cs10.3.21-3.debian.tar.xz
Checksums-Sha256:
 fba38807e6fe4a70e6d5749d9dac4adec5aaca2eda361397f57adbc37da6ca9b 30408 node-minipass_5.0.0+~cs10.3.21.orig-minipass-collect.tar.gz
 b3f0e71c45232a014d2c4a9645f17a0873b186b13c90013de5f741fd7891c170 50330 node-minipass_5.0.0+~cs10.3.21.orig-minipass-fetch.tar.gz
 7e1a7bbb1be9870ec6befb82417c73ec11bad4a79978b8da8f4f89cebe2c9723 30671 node-minipass_5.0.0+~cs10.3.21.orig-minipass-flush.tar.gz
 33d7043dddf13f3ad1f569e66a48a12fda56667bea85752df7063ccb7932a878 39556 node-minipass_5.0.0+~cs10.3.21.orig-minipass-json-stream.tar.gz
 2ad58f5e9e931232fb976969c95d7382ef3a435c4dcf5cf53f360a9822934c77 32921 node-minipass_5.0.0+~cs10.3.21.orig-minipass-pipeline.tar.gz
 cf6017f6ea69da61cfd82cfce3d6f3834d4aeafd209b53726fc2aaa4e2853f33 30904 node-minipass_5.0.0+~cs10.3.21.orig-minipass-sized.tar.gz
 d1eeab2a8b7467581240303e3ab29fb9680d8bf7498738ee81ea81e8849cbb40 186669 node-minipass_5.0.0+~cs10.3.21.orig-minizlib.tar.gz
 690f071db3e84137774168c704a8f4d95b9fd89e1e7698262daa09781a05b548 86487 node-minipass_5.0.0+~cs10.3.21.orig.tar.gz
 017c1531a0634df23563aa643160ab4fca4ec735382f8e835333893296e26729 22396 node-minipass_5.0.0+~cs10.3.21-3.debian.tar.xz
Files:
 960e870151462996724b8aaf2eb8084b 30408 node-minipass_5.0.0+~cs10.3.21.orig-minipass-collect.tar.gz
 2291a77f84bee531df6feb2e0fd3eba0 50330 node-minipass_5.0.0+~cs10.3.21.orig-minipass-fetch.tar.gz
 7f1831af4944a2ebf407a5863c26fc1c 30671 node-minipass_5.0.0+~cs10.3.21.orig-minipass-flush.tar.gz
 fe3cec3ef6cebcec6cf52f10283b28d3 39556 node-minipass_5.0.0+~cs10.3.21.orig-minipass-json-stream.tar.gz
 a46d05b8d97745f40b97434f96065b6a 32921 node-minipass_5.0.0+~cs10.3.21.orig-minipass-pipeline.tar.gz
 bab49a0ff1d7d960576c410978d1721e 30904 node-minipass_5.0.0+~cs10.3.21.orig-minipass-sized.tar.gz
 ffcc50010150f81e17c469199f9d709a 186669 node-minipass_5.0.0+~cs10.3.21.orig-minizlib.tar.gz
 02102159c3ed7df5ed7d7573eefab149 86487 node-minipass_5.0.0+~cs10.3.21.orig.tar.gz
 dc1e55c8abb5239ac8cea1204bc58769 22396 node-minipass_5.0.0+~cs10.3.21-3.debian.tar.xz


-----BEGIN PGP SIGNATURE-----

iQJGBAEBCAAwFiEEA8Tnq7iA9SQwbkgVZhHAXt0583QFAmfBku4SHGthcG91ZXJA
bWVsaXgub3JnAAoJEGYRwF7dOfN0L38P+gORmvaMEJOO9IJqqaSPpY7Uh1Yc63mJ
2WkFAkB5HmlynrYvFSBXjnMc3lN4Zlfb5DAYBjAMIJaWPSWJFJqMQGA3hEMqn9px
HCc+I4tCWDjegi7TwIBwWtUnglK+d8H1VydkcdWanBRx3HktuQxBrlSPk5ePZLrK
ZDiOS3OIElmYDrXc0uzD9MUoralpYbfqYNVU3NB3Et2iohB/MTJphLC7f69B+cjo
tIiNJlVHYxheibW8zq9XZ6xjhbVfA/7xfIcj1TLEFAiz+vyojO6rjbndiWZjtfhO
TtSU6UeVaF2Yn8aWWgETbVTqTmTvbxInrCSLokPmn59ZnqlrqvBH7EZ+X/3ZuHsI
D5hhjh2FpEvDxEFEDI0uVrV5JZeaGiqgRC6xW69wGUpuyg4uDgYcGV9cZMh9aeX7
6Vn8u5oJDfkA0H0K8/4Uto4Hx9OjUyeF5KgZzI6DckpMIx69lCQsO7IR9rFQHjY8
OZuPuUWbMvAWP+EQdU7tfVFD4QFNhljF+4D8cBnj/C1wvDLLKL03m4Ma/xjJruWw
wL3+ihKCU3JSF7y8MclU8ju+2UP+UKLpcZvVeGcgg5Gt60XbhMma8PQN+Z64iXgb
JJh5HuTuoMDUgX9RxuF69tLss8IIxJG9FQoJ3MDxORLPZaN/CRsmAoay4+O6/hso
YzmryIp6dzqE
=MsZd
-----END PGP SIGNATURE-----
