-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

Format: 3.0 (quilt)
Source: node-istanbul
Binary: node-istanbul
Architecture: all
Version: 0.4.5+repack10+~cs98.25.59-3
Maintainer: Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>
Uploaders: Bastien Roucariès <rouca@debian.org>
Homepage: https://github.com/gotwarlost/istanbul#readme
Standards-Version: 4.7.0
Vcs-Browser: https://salsa.debian.org/js-team/node-istanbul
Vcs-Git: https://salsa.debian.org/js-team/node-istanbul.git
Testsuite: autopkgtest, autopkgtest-pkg-nodejs
Build-Depends: debhelper-compat (= 13), dh-sequence-nodejs, handlebars <!nocheck>, help2man, libjs-prettify, node-abbrev <!nocheck>, node-archy <!nocheck>, node-async (>= 3) <!nocheck>, node-babel-loader, node-babel7, node-es6-error (>= 4.1.1-4~) <!nocheck>, node-escodegen <!nocheck>, node-esprima <!nocheck>, node-glob <!nocheck>, node-is-stream <!nocheck>, node-jridgewell-trace-mapping <!nocheck>, node-js-yaml <!nocheck>, node-make-dir <!nocheck>, node-mkdirp <!nocheck>, node-nopt <!nocheck>, node-once <!nocheck>, node-p-map <!nocheck>, node-path-key <!nocheck>, node-react, node-react-dom, node-resolve <!nocheck>, node-rimraf <!nocheck>, node-shebang-command <!nocheck>, node-strip-bom, node-supports-color <!nocheck>, node-type-fest <!nocheck>, node-uuid <!nocheck>, node-which <!nocheck>, node-wordwrap <!nocheck>, nodejs:native (>= 12), nodeunit <!nocheck>, rollup, terser, webpack
Package-List:
 node-istanbul deb javascript optional arch=all
Checksums-Sha1:
 1dbfeea8e93e1a452ccd517ec83e888bd5c4c00a 63312 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-append-transform.tar.xz
 48dc4fd896640f6e728762d7d01b461cf97725a0 10424 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-babel-plugin-istanbul.tar.xz
 b82222f3094d913e53b753da1ccc5df264321ab0 59632 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-caching-transform.tar.xz
 9ddbcc458a3ac372a1d57ebd80025cf63755d133 2436 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-default-require-extensions.tar.xz
 1b205d84267e79f0de7fb080e51e28010c6c23a3 3876 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-get-package-type.tar.xz
 56cffd9adeddcf9e52217a08934defc0949a8a75 57048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-hasha.tar.xz
 e2e60e61d1bbb2c4636ec820b585cb6d0cd7fe39 4584 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-html-escaper.tar.xz
 40056899ca79445db32136f939c8a80ca0f3ecbe 7496 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-coverage.tar.xz
 febf4a9035cba5feccade67bdedec52feddceda7 4528 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-hook.tar.xz
 f7a917dcbd52652a55edf687cf823efa41222cbb 14384 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-instrument.tar.xz
 711e8fb3ca9feb82c7a84342c94b5db78da3f1c7 11048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-processinfo.tar.xz
 4ec8386773459636ee93ecf64d6e9cdda03c1870 9784 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-report.tar.xz
 6b9d2c70dc73fe7b31fa59583b781f10f0d9bba5 8156 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-source-maps.tar.xz
 db58c9c3ea548904cb05a07a1e7b5aa71a2ffe0b 26080 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-reports.tar.xz
 ce99546bcc000c235dabac74ddeae6d76927b529 7564 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbuljs-load-nyc-config.tar.xz
 87203044725d167e53e8199983c455e966f252ed 7164 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbuljs-schema.tar.xz
 58c4214ba389314b3ecb016ca2b0f6df84e6844b 6048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-node-preload.tar.xz
 c58a734d0e81f94d17ba5c8990b36be6e34ab328 212020 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-nyc.tar.xz
 4416749f9b18fc0454ea0a5fe5e68e9d3886d0b6 17084 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-package-hash.tar.xz
 3aaf963cfdee44a8f5675dc19cfde83b4fbc7632 5352 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-process-on-spawn.tar.xz
 51524a947a042f80984e6a050d176214cc57e44c 6116 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-release-zalgo.tar.xz
 3df765a963c55d4618b8c8f594f749a8c8d1dfdf 47908 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-spawn-wrap.tar.xz
 f8788522a6abed781546317effe2fe853a0d86b7 9168 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-test-exclude.tar.xz
 d0f51d9a538b402f8c2560a87ce730cc1021f15c 2156 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-coverage.tar.xz
 5088de833cf1588c221b39c40f5571e33e413958 2112 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-instrument.tar.xz
 0dd5aef5fe298b61b930b9be426abd9ae235a6a8 3056 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-report.tar.xz
 605e5b23443cd5e60b753fe36e546cfaca399b9e 1968 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-source-maps.tar.xz
 1908118d3fe415314a489a7a7710f0e0e187f134 2176 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-reports.tar.xz
 022f19aea6288d8cde3feb39bb2a538c06189a23 1860 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul.tar.xz
 1bb4f596681c3c0ae1a41002f6a49cd400362479 72800 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-v8-to-istanbul.tar.xz
 9d13fcd87618c87533cc31588ac71e4f4991f376 96744 node-istanbul_0.4.5+repack10+~cs98.25.59.orig.tar.xz
 f2d86ecc78fb08b096d171852de06e1ffbf0e3a0 13452 node-istanbul_0.4.5+repack10+~cs98.25.59-3.debian.tar.xz
Checksums-Sha256:
 625dbd76799c902bf9709cd68bb9c0223b009a620287fdfdc94a97cfdc09a7e4 63312 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-append-transform.tar.xz
 ad43f3272a80c197bb80f722538e47f05038f42ef08d5ec1be46d51b5cc51975 10424 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-babel-plugin-istanbul.tar.xz
 9fbfae09cf19f88456180dc7c0a1ca8c6d1d902818c3b29b9d866f2e84d0d73c 59632 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-caching-transform.tar.xz
 4e9b9cd6e98ad9fa74570ce2849bd907b897157f063c5739800140ebad0fa022 2436 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-default-require-extensions.tar.xz
 ad752c4516dda5afe316750ddb522bc023b87f7c59de6c876be1f2e945d5fbc0 3876 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-get-package-type.tar.xz
 33850e9b8381ccc9a954f6d97992add7b927c05622137131b1eabb4165958130 57048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-hasha.tar.xz
 c140edf9e51f021974796670c525350e15aeb707a05bd7bf02a002e6598db3b9 4584 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-html-escaper.tar.xz
 bd767a3844f547bd7867a031dc5904cfeb49d193509a1a7315b37c73cc708c31 7496 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-coverage.tar.xz
 3077b150c55f0f941dae93c225dbb05005d105e75269e443e394cab742e1d193 4528 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-hook.tar.xz
 b4bf2b5256f613bfb82f478355f5a4f812f13524c8452b3b4d69e23063bae626 14384 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-instrument.tar.xz
 1c7e3092782b47beacedfebce881b7958a7a18df7e1f3f73f94b022bb53d72d8 11048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-processinfo.tar.xz
 3f2b7c134d6ffc83d0c4409dd0cc648caed2378763d95a2a6b2476666f5d33b8 9784 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-report.tar.xz
 fafb1f86477a3cff7302c8f8a2ec33741784e1813447a92f4b1f2b457149f447 8156 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-source-maps.tar.xz
 c05db57eb1a5453bb36f7182850a7fcd9bcf06990156afbebf88199fc0367769 26080 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-reports.tar.xz
 cd655c4e90cfeea0c2f1e476a07831f61561910e222894b4fb32a2393081a979 7564 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbuljs-load-nyc-config.tar.xz
 8afa8c8edb79c444858bbb2d29f2582df3ecd5688c7a8ef88085e948f8938fdb 7164 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbuljs-schema.tar.xz
 8d77c0bb59b98339847c5fbdc0bb81c440d42adc29c747ec269c24d38688febe 6048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-node-preload.tar.xz
 7831f5b3f0f024ebe33ea7598f7c56601f598d8c124c2bf009b198887f15c0e9 212020 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-nyc.tar.xz
 aa81b39a4931a96be37125ce853d456b14872d8000633d33f3f97873256674df 17084 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-package-hash.tar.xz
 82bbc6c63c59b4330c7f29cd06680bcfe83d4bb6a462a4945fb66c2d2bed4899 5352 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-process-on-spawn.tar.xz
 50fa59ddc63371d052bf5378a0336d6c12a505cb9ec348da48ebf483272f56d8 6116 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-release-zalgo.tar.xz
 2f9a38d6f527d0ad59f28cc484570d68e26631819d55389f6e66bfef3b0b967e 47908 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-spawn-wrap.tar.xz
 eabbb96c856e5bf9d886881f1ac685974b3b61e0602b2b0240a91960ed587ad1 9168 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-test-exclude.tar.xz
 8e3a45f2d64249e92c8e90b6624c7e66c8d3eefe8abf57c25c0ef606d754c7dc 2156 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-coverage.tar.xz
 a8c952b6808e91a325f42adba5094b50761a080e20c49bbc3802dc19e3530bbc 2112 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-instrument.tar.xz
 8c92d546e9906012bd64bde5f17d982b90b610eaf41473f3679e2798580e0641 3056 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-report.tar.xz
 564b1d75cc1f28a2ba507f64cc7710468bf9d49cb8fbe52a8dc99d4538ecdb63 1968 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-source-maps.tar.xz
 d10db5d8c813a75dc34744f503ac0d9fd3d142f90c5b488395eee4d477abdf90 2176 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-reports.tar.xz
 1078c0206f93cd03e83f6579c6b94de29ed42f96c9ccfa85dc0aa0d23d59210b 1860 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul.tar.xz
 fe0f8cf60b1051425107099abf11aa3eb8d6ed94b71f850209dcc90708b92b6b 72800 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-v8-to-istanbul.tar.xz
 0b2e043f8a95fa956a587a15b0ea95d86b60334c66c8d25082e28afbdf76f4ed 96744 node-istanbul_0.4.5+repack10+~cs98.25.59.orig.tar.xz
 cbf87971844299820cdbe3b6836d51bc043027289ff7bb5660f752866b326551 13452 node-istanbul_0.4.5+repack10+~cs98.25.59-3.debian.tar.xz
Files:
 5c835dbf008324777b46f9ea3712e9f5 63312 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-append-transform.tar.xz
 1618d6f59b011c28ea377f9772ad278e 10424 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-babel-plugin-istanbul.tar.xz
 419a529f2f3223b6a5edcc2f50a21f27 59632 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-caching-transform.tar.xz
 fdf45139b8cad013a2e5ddde4292409d 2436 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-default-require-extensions.tar.xz
 1ad5e82c6ca08f0712f65eb68360b42b 3876 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-get-package-type.tar.xz
 bb2d2c198e32ef9b3fe477dfc4cf0c99 57048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-hasha.tar.xz
 55e1993a387a6ff2fb6f1830b594a9b8 4584 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-html-escaper.tar.xz
 03aef21901f2552fb58e61bf4b86c48d 7496 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-coverage.tar.xz
 f71521123ce6d05ed0aa11c846daac44 4528 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-hook.tar.xz
 9f0f2d60923b483276f529dcbbcb2301 14384 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-instrument.tar.xz
 ca2d1a91e0fe65eb5afe72f12e375356 11048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-processinfo.tar.xz
 f5daede552090754768e19e5fc1d63e9 9784 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-report.tar.xz
 ee4c8d074a6d736c1c7ae15bfcbfb8e5 8156 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-lib-source-maps.tar.xz
 6b09ec17551f6950974952661aa13d03 26080 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbul-reports.tar.xz
 e72763b836a6e66cbeb2a9c873113a0d 7564 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbuljs-load-nyc-config.tar.xz
 b38636c7384d691b52d520e994de5fab 7164 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-istanbuljs-schema.tar.xz
 c1e4ac26e1d37dc03712a8978bc55840 6048 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-node-preload.tar.xz
 48d5690aec667c7341b8286619eec0f1 212020 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-nyc.tar.xz
 1e32f817a8e798128ee0ca7238a795d8 17084 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-package-hash.tar.xz
 3f610c1ecd9d4b12885a37929e526eb3 5352 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-process-on-spawn.tar.xz
 9a0df3968f378bb9ce0f9d7fe5661835 6116 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-release-zalgo.tar.xz
 4af639b9bb6c0e5af4a17fcc581393de 47908 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-spawn-wrap.tar.xz
 ccaa2dff1ef10d503587f46c321eb90d 9168 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-test-exclude.tar.xz
 cc7ce2fcb0e15668d0756ba75942ba1e 2156 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-coverage.tar.xz
 febaa6eea12234e73b7a824c82e22189 2112 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-instrument.tar.xz
 265f75052c45354cc2b75766f8c7ac62 3056 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-report.tar.xz
 f03e274930ed1595d59c72b9338e250b 1968 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-lib-source-maps.tar.xz
 99928e2d6fe8dcbd78f78faec8ba4c61 2176 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul-reports.tar.xz
 fde0b9a424b73188e3f6a0d2f6fab1c8 1860 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-types-istanbul.tar.xz
 9d2cbf57a407bdcfd40198a922b22b36 72800 node-istanbul_0.4.5+repack10+~cs98.25.59.orig-v8-to-istanbul.tar.xz
 c75e89641d6c0e8ea732a0745ae68c70 96744 node-istanbul_0.4.5+repack10+~cs98.25.59.orig.tar.xz
 c860fcacf5701a091b209410abc3fbd9 13452 node-istanbul_0.4.5+repack10+~cs98.25.59-3.debian.tar.xz

-----BEGIN PGP SIGNATURE-----

iQIzBAEBCAAdFiEEfhrD+iemSShMMj72aVxCkxbAe/4FAmb0XboACgkQaVxCkxbA
e/6OUw/+M1bCOEzGQ9HVmD1H6WP6yZCSOwVvORfa3EvajczqW0PmccQR1GXdqHlK
qezH77yQhTQri9pwtx37uFIQ/0Eeg2hZxJgMjRO5V1ZRbzmehmSUTli7vWURvz/G
gSBOZdIdGYl6h1/fcU3SH8Mk4C3NO+4T8TsAwdBrM+SCL96x3jTZUcJ9kh+LNRcT
Eme2NzcfcMyJRYBSp/Hh15czPcl0Uo/l8Ogpl+au0EP4VBuJ+gU2PKLNG6GaRun/
HRmzdpoxdEnmvSF2jEubn8dKKdj/FX+Wqwl8NL5/165N/XghcRTL7C0J0kEPOwu3
ypqBJfDUTVyg6I7UC8kYknGJtkSBdnbR3BP5Zm/qsNIIn4RxNoXmr1k5macav6QT
rjbiTHYM/OJGHD8AQLnlrpJHdu1LCm4i2zOom53J8yRKMfZZ/yS91ea+OPpBG49d
S4HcMdZNAjyOa+XL/oWQsi8CJlF2bhNXNS7+MFnh/JZto+yvHM0IO7UbNGCVk0Wt
qrvoRoezTCdx1UWxSQfq8Dm1yxpvjkNfCElyS6RrUUAqrBjhNgyAlDKADQ7hm/18
02oTdkks1naoYDQlvNIbgu433L+2WPD5up65nhipVa0SzRF7gnee5E8KmC35xese
f4MbaWVXS8FUWRNqkzaEcPmc9hlenA+wdUnTsUUmk8hFaFA6PoE=
=S8Rh
-----END PGP SIGNATURE-----
