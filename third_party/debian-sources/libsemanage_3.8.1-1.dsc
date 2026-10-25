-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

Format: 3.0 (quilt)
Source: libsemanage
Binary: libsemanage-common, libsemanage2, libsemanage-dev, ruby-semanage, python3-semanage, semanage-utils
Architecture: linux-any all
Version: 3.8.1-1
Maintainer: Debian SELinux maintainers <selinux-devel@lists.alioth.debian.org>
Uploaders: Laurent Bigonville <bigon@debian.org>, Russell Coker <russell@coker.com.au>
Homepage: https://selinuxproject.org
Standards-Version: 4.6.2
Vcs-Browser: https://salsa.debian.org/selinux-team/libsemanage
Vcs-Git: https://salsa.debian.org/selinux-team/libsemanage.git
Build-Depends: bison, debhelper-compat (= 13), dh-sequence-python3 <!nopython>, dh-sequence-ruby <!noruby>, file, flex, gem2deb (>= 0.5.0~) <!noruby>, libaudit-dev, libbz2-dev, libcunit1-dev <!nocheck>, libpython3-all-dev <!nopython>, libselinux1-dev (>= 3.8.1), libsepol-dev (>= 3.8.1), pkg-config, python3-all-dev:any <!nopython>, secilc (>= 3.8.1) <!nocheck>, swig <!nopython> <!noruby>
Package-List:
 libsemanage-common deb libs optional arch=all
 libsemanage-dev deb libdevel optional arch=linux-any
 libsemanage2 deb libs optional arch=linux-any
 python3-semanage deb python optional arch=linux-any profile=!nopython
 ruby-semanage deb ruby optional arch=linux-any profile=!noruby
 semanage-utils deb admin optional arch=all
Checksums-Sha1:
 6cd27679ad83becede4ac4d92beea54dabbe695a 184618 libsemanage_3.8.1.orig.tar.gz
 13e857e719133b658b5ce7870e2fd8629364ce9e 833 libsemanage_3.8.1.orig.tar.gz.asc
 b3faa24ae0a937771fa9338e66650cacc22e2a53 37572 libsemanage_3.8.1-1.debian.tar.xz
Checksums-Sha256:
 7b39127b219cc70bfd935a4af6b0f2ba83d4b35c916f253c7e942c23ab490f07 184618 libsemanage_3.8.1.orig.tar.gz
 5b4856cb5823fba1b247ff1b5355692706da68a4df61a936d1b33b1f9e9b2f3d 833 libsemanage_3.8.1.orig.tar.gz.asc
 6d1e5bd4d06bbd25ced1b75fba394c3e2157bd604cf1cd33fb581793d70bd7b8 37572 libsemanage_3.8.1-1.debian.tar.xz
Files:
 252486b4790b01bab459a30126027555 184618 libsemanage_3.8.1.orig.tar.gz
 454022a904745a0bc092e8c1e8deae79 833 libsemanage_3.8.1.orig.tar.gz.asc
 953c99e824e2baeecc6472d5ca5422e2 37572 libsemanage_3.8.1-1.debian.tar.xz
Ruby-Versions: all


-----BEGIN PGP SIGNATURE-----

iQIzBAEBCgAdFiEEn31hncwG9XwCqmbH0UHNMPxLj3kFAmfWjzkACgkQ0UHNMPxL
j3nv6BAAs1ENLrgp1kNKHP4FpxW2ev4EmltlGcfwIUVEgF1uk98nwBJIOYlahnhw
Vx7OrAbNLgYlS9Qq9mTN1Apn+TWMxu52vTy8zxzRs5twdR5w6yUx89ZN6Jp2RIjb
bRU1VMIRCYGhd7yN9Ul+f455BZkM8Y+FBKjPzbxH+VuYPWjZTUL5Wa5OFBsRC7OO
uWVhDcG/nQUk73QA/wnkJWf3tOejYI6azuhAG1aDPGSg4pcrVNVwEwUMJyeSu+m1
oSs4Plu0TACzj1/yoTk0TboHedn7LLFjWup+52ayGm4pFEv9yUaMO9Fm9Ym026o4
yJ4l6QiTtS8o0TaUpsM/D1rQt82r5yb9ewpzWesBx9ymT9ABQx/bNnFPDEbZ05Ez
p865MaNo+tZZsBotnl2hL5mtXv/y6yvyBfJVCQ4M7fUQtPSy0F50X32ATl24o/+h
xxeKJt0P9emxtVYyT8gMYSDOq0HlmpjsdmIjHjQJmFrOZs4/Y+WPif3aNCR4acvS
bpRaWal2numM3cVoIqSltby0ATkSJTYuO0ZVDCY+m1+UphXm8YsUJZzBUY9tng5J
s3DqGrerWS/mvpfB6y/5UWfftgxhgKdXi5S8hXrep0+eCfBKeVduf9M20Y30CQP9
u6vcgIvEUeqpGy00Xko6kNLsAxxNrgdnu0aive9zlsxQYTDJeRw=
=v/2p
-----END PGP SIGNATURE-----
