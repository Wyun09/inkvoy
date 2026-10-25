-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: node-cacache
Binary: node-cacache
Architecture: all
Version: 17.0.3+~cs10.3.7-2
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders: Pirate Praveen <praveen@debian.org>, Yadd <yadd@debian.org>
Homepage: https://github.com/npm/cacache#readme
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/js-team/node-cacache
Vcs-Git: https://salsa.debian.org/js-team/node-cacache.git
Testsuite: autopkgtest-pkg-nodejs
Build-Depends: debhelper-compat (= 13), dh-sequence-nodejs, node-bluebird <!nocheck>, node-chownr <!nocheck>, node-flush-write-stream (>= 1.0.3), node-glob <!nocheck>, node-graceful-fs <!nocheck>, node-lru-cache (>= 7) <!nocheck>, node-minipass (>> 3.3.6+~cs9.4.19-3~) <!nocheck>, node-mississippi <!nocheck>, node-mkdirp (>= 1.0.3) <!nocheck>, node-move-concurrently <!nocheck>, node-p-map (>= 3.0.0) <!nocheck>, node-promise-inflight <!nocheck>, node-rimraf <!nocheck>, node-semver <!nocheck>, node-ssri (>= 9) <!nocheck>, node-tacks <!nocheck>, node-tap (>= 15) <!nocheck>, node-unique-filename <!nocheck>, node-y18n <!nocheck>
Package-List:
 node-cacache deb javascript optional arch=all
Checksums-Sha1:
 24db077a0a6c3c707c576aa218cc18adef0d34ac 35270 node-cacache_17.0.3+~cs10.3.7.orig-fs-minipass.tar.gz
 34a3e5b17451e4bcdc692c9b919a551b05d54b48 3361 node-cacache_17.0.3+~cs10.3.7.orig-gar-promisify.tar.gz
 2db4b5f81878db6a7ba4e64197b51055b65f6c16 24073 node-cacache_17.0.3+~cs10.3.7.orig-infer-owner.tar.gz
 ff0b9826e5a1b67b9779dbc75786552151a536dd 21638 node-cacache_17.0.3+~cs10.3.7.orig-npmcli-fs.tar.gz
 e90ad925d4c9bd1c41db909f884f8052d5eb6d60 11693 node-cacache_17.0.3+~cs10.3.7.orig-npmcli-move-file.tar.gz
 9b7e71f193e8bffa4f2329f4493d8887307762c3 54108 node-cacache_17.0.3+~cs10.3.7.orig.tar.gz
 07c6eaabc81d9fac7fbefbaa729da89a12f20bcf 5364 node-cacache_17.0.3+~cs10.3.7-2.debian.tar.xz
Checksums-Sha256:
 83cf7dc113dacdbe3a2d05753edde01c37256cc97167ea5a8086ab85a78f2efd 35270 node-cacache_17.0.3+~cs10.3.7.orig-fs-minipass.tar.gz
 3ef1a21c4e93913862335baa64d3f06ab955eafa435880c3ea80afea5670e275 3361 node-cacache_17.0.3+~cs10.3.7.orig-gar-promisify.tar.gz
 c7baff0c5b4c3c7af772be0b33087f3c16cf8fcce3459cd82a8481133765c2c2 24073 node-cacache_17.0.3+~cs10.3.7.orig-infer-owner.tar.gz
 32d9d3cd35eff94e6abcd968772915c8565b26686c3c6a97ff5e23304e313310 21638 node-cacache_17.0.3+~cs10.3.7.orig-npmcli-fs.tar.gz
 4ebdff0e49c3a9d76bbadaabded8f95c3dfb326a94fe5e940820b3efb658a871 11693 node-cacache_17.0.3+~cs10.3.7.orig-npmcli-move-file.tar.gz
 2daa2c943a9cf316eef10eda6883ac967ca32cc28de9decef147ea42bdc34283 54108 node-cacache_17.0.3+~cs10.3.7.orig.tar.gz
 a7e258d43bc0b87db44eb172add4277380ff4835d55c09f1b371508cb3a385f8 5364 node-cacache_17.0.3+~cs10.3.7-2.debian.tar.xz
Files:
 4885211b9cf2f530a54e6a725cc9556f 35270 node-cacache_17.0.3+~cs10.3.7.orig-fs-minipass.tar.gz
 1719f3e086640e4fbe17bdd9d35227df 3361 node-cacache_17.0.3+~cs10.3.7.orig-gar-promisify.tar.gz
 2256384bd90ca95dd229fa4d863d655d 24073 node-cacache_17.0.3+~cs10.3.7.orig-infer-owner.tar.gz
 1bd113d6c058ee74f1468eb4cb5a53f4 21638 node-cacache_17.0.3+~cs10.3.7.orig-npmcli-fs.tar.gz
 18eaddabd9ab10725b081d40e0925073 11693 node-cacache_17.0.3+~cs10.3.7.orig-npmcli-move-file.tar.gz
 b326514e0ecddb6dc2b20fa7af93acda 54108 node-cacache_17.0.3+~cs10.3.7.orig.tar.gz
 ca5add91061adee952496b59332d020b 5364 node-cacache_17.0.3+~cs10.3.7-2.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQJFBAEBCgAvFiEEXQGHuUCiRbrXsPVqADoaLapBCF8FAma45WYRHHJvdWNhQGRl
Ymlhbi5vcmcACgkQADoaLapBCF/wCxAAoHMlIImrhWfOeAQ8uTi4di3qRyng6Gof
eka1Rg3czSzyilIxUcQzKC/nNB/Sa3uP1XYzrzFCfBkNfOQWLjhOL7BWiHuaT9Fq
Q/f9Ijf94fMBwyR5OgUwi39v3BolRBV0DNqV9pGrepjoq/kvwCptp1SP2nu29hV5
437cTsl9l7qHrwSCmScjdUnG5KgKZ3e/JGFx+A7RiAZDDYmf+DKy7wORnjIJXCUk
sDaYFkTiPKfjgYBRvC8pDAmoT8URfXpnnzwEJfVlOLAz70oyfREZTKReQE3jYvkj
COWBPFkem55TooP91SuulH49Sm8vrxiLSqvdAIMlUHvwqXTiwgSav0Ghl2lrLMIB
0pgSGsuxStyhR2ZH+h95RSb3cv+kf/rcDg2CXgW4pZHeA80rxXXNYnMEHp+FFiNW
vqeOKqduILM1fzIDQ1vUDwp1mJUnGRvQILgk2Kb+/qrkTd8q9vneO3MEygGw3WpU
55Y0kMxheCRD4t8CN4VmOCBJpfh2vpTjjaqRaZ4+IY8tvrlN5JEYmF3Ebh6iQeKu
rc597lVu2j5XucC1NvIpFaY7ZZdjK5PbvLGSqhZbADxPiC+DhBPh0SGCNw8e0y7q
WdIXfyFt4Ok2f3fXlMDK8tRYEzi/mxS471/mhU3U5EGP+CGs7yS5r8bFIa9ETI3Y
F34jXzUZFgQ=
=sHCA
-----END PGP SIGNATURE-----
