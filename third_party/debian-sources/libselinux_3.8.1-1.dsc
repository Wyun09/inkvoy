-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: libselinux
Binary: selinux-utils, libselinux1, libselinux1-dev, libselinux1-udeb, ruby-selinux, python3-selinux
Architecture: linux-any
Version: 3.8.1-1
Maintainer: Debian SELinux maintainers <selinux-devel@lists.alioth.debian.org>
Uploaders: Laurent Bigonville <bigon@debian.org>, Russell Coker <russell@coker.com.au>
Homepage: https://github.com/SELinuxProject
Standards-Version: 4.6.2
Vcs-Browser: https://salsa.debian.org/selinux-team/libselinux
Vcs-Git: https://salsa.debian.org/selinux-team/libselinux.git
Testsuite: autopkgtest
Testsuite-Triggers: build-essential, pkg-config, python3-all
Build-Depends: debhelper-compat (= 13), dh-sequence-python3 <!nopython>, dh-sequence-ruby <!noruby>, file, libsepol-dev (>= 3.8.1), libpcre2-dev, libpython3-all-dev <!nopython>, pkg-config, python3-all-dev:any <!nopython>, python3-pip <!nopython>, python3-setuptools <!nopython>, swig <!nopython> <!noruby>
Package-List:
 libselinux1 deb libs optional arch=linux-any
 libselinux1-dev deb libdevel optional arch=linux-any
 libselinux1-udeb udeb debian-installer optional arch=linux-any profile=!noudeb
 python3-selinux deb python optional arch=linux-any profile=!nopython
 ruby-selinux deb ruby optional arch=linux-any profile=!noruby
 selinux-utils deb admin optional arch=linux-any
Checksums-Sha1:
 e039453ee0b5ebb980ddf082a2b1024171913834 204411 libselinux_3.8.1.orig.tar.gz
 f43f4b604b59642e23e41713fb7ba465094f5fd3 833 libselinux_3.8.1.orig.tar.gz.asc
 5999a5d34d86dbf2379f1a41abe8cb9706721d8d 37812 libselinux_3.8.1-1.debian.tar.xz
Checksums-Sha256:
 ec2d2789f931152d21c1db1eb4bc202ce4eccede34d9be9e360e3b45243cee2c 204411 libselinux_3.8.1.orig.tar.gz
 7f983714a780d89f7677e7ba140ce29974022b8ba225f60246b6c33de1477dd6 833 libselinux_3.8.1.orig.tar.gz.asc
 1af25952374f083cf3d6d0edd5beb938f2e53c30eb404afa1e32fcd1cb127db7 37812 libselinux_3.8.1-1.debian.tar.xz
Files:
 769362224f270b441859d047197b3ec0 204411 libselinux_3.8.1.orig.tar.gz
 67fd76ef0640e8529253627fb24fdb39 833 libselinux_3.8.1.orig.tar.gz.asc
 bec01e3f64a9b5bf948df55b6504ac76 37812 libselinux_3.8.1-1.debian.tar.xz
Ruby-Versions: all


-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEn31hncwG9XwCqmbH0UHNMPxLj3kFAmfWjzkACgkQ0UHNMPxL
j3k3sBAAlO05yHkYkg8eYwh1d+QoIJDO0+VX2fbtUQ24hlOc3YfZ9d4NidaHWLg8
ySaWcb6la/BlajJD7zQ3jzFEIjeIxUvH1ZdLcMfGgsCk+acqLJu+Wn1Y722wpOXN
o/dNqciOKazqA/qAgcO1qVCcS7/RULDne7s6sbugzL6aHttOQP3GA2PwV98dd1Ei
kEKwi0LUQYk+How6gAMr7s0iewa1b/kf4n//N6RVxIqHAQxkiRXmQF51aaexx0eo
inBkjBX66LRNJYhf/6atDNIQodbqm7fSG28Vis83DnmkRMuquAE15oh7GvPhot/C
WCAlxrZkwPI6DmXaf5rC2yXqptc0x81eewo0939TfYOZUgLjvAg+EbfIizJt5fZW
wA+1AxhAI1+2doraLLLsWyrSVdNN/RxjbBQf5Mu0q+x3XvfrATz3w9JJekMzHfu/
T85gOcLB74LZigM95vz6GrZPg8HzS6LVL66giBiJniJxT6iQFz/Yc4Ep7w5sMy4i
qi+49pfQedXBvtqlBI5kibjXV6eYaV9z7wr/lCnjdGC1WItl/mOEsNNPi6QuTFYc
0x7bHO+2LPTTrW8FQQO/x+H0XnaKaoQi4leHo0MJBWR76avp8Bipi0x7jztvz8nC
wCRJMcicPhyChdljrYy7fw4VxvXKhHim8Oj4Rz7oXuh6pBh12GI=
=84qe
-----END PGP SIGNATURE-----
