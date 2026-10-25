# 发布源码恢复记录

以下分支来自实际保存的源码目录或经过文件清单检查的发布 ZIP。每个快照在 `SNAPSHOT.json` 中记录来源和恢复时间；恢复提交使用真实导入日期，不伪装成当年的逐次开发记录。

| 版本 | 分支 | 恢复提交 |
|---|---|---|
| 0.1.0 | [release/0.1.0](https://github.com/Wyun09/inkvoy/tree/release/0.1.0) | [99100e43](https://github.com/Wyun09/inkvoy/commit/99100e4377c4d0af10ec4263fcc323a407fe19ed) |
| 0.2.0 | [release/0.2.0](https://github.com/Wyun09/inkvoy/tree/release/0.2.0) | [0cc3bf16](https://github.com/Wyun09/inkvoy/commit/0cc3bf16ff3572a73ba243520df855e317895692) |
| 0.2.1 | [release/0.2.1](https://github.com/Wyun09/inkvoy/tree/release/0.2.1) | [18a7ded1](https://github.com/Wyun09/inkvoy/commit/18a7ded1b4ee7a7b5945ee143fbfac6d8a137055) |
| 0.3.0 | [release/0.3.0](https://github.com/Wyun09/inkvoy/tree/release/0.3.0) | [b5337c0a](https://github.com/Wyun09/inkvoy/commit/b5337c0af3b49c52868a7a8d414ab8514714439f) |
| 0.4.0 | [release/0.4.0](https://github.com/Wyun09/inkvoy/tree/release/0.4.0) | [f1a39278](https://github.com/Wyun09/inkvoy/commit/f1a392782e4c7b0c9807624fac815703c13e2623) |
| 1.0.0 | [release/1.0.0](https://github.com/Wyun09/inkvoy/tree/release/1.0.0) | [37710b62](https://github.com/Wyun09/inkvoy/commit/37710b62da3a716fee26d5e71675554ba89c8ede) |
| 2.2.0 | [release/2.2.0](https://github.com/Wyun09/inkvoy/tree/release/2.2.0) | [54229053](https://github.com/Wyun09/inkvoy/commit/54229053879e1f0debf583e85c1a583ee9fe4f77) |
| 2.3.0 | [release/2.3.0](https://github.com/Wyun09/inkvoy/tree/release/2.3.0) | [7a3406b3](https://github.com/Wyun09/inkvoy/commit/7a3406b39ebe44378e38aeb2d06c6403ec1f304d) |
| 2.3.1 | [release/2.3.1](https://github.com/Wyun09/inkvoy/tree/release/2.3.1) | [0f15bff0](https://github.com/Wyun09/inkvoy/commit/0f15bff0461644677e97289ec81f37d75e9a907e) |
| 2.4.0 | [release/2.4.0](https://github.com/Wyun09/inkvoy/tree/release/2.4.0) | [962a805b](https://github.com/Wyun09/inkvoy/commit/962a805b7f9e2952afde6f9f4aa264b3c0316127) |
| 2.4.1 | [release/2.4.1](https://github.com/Wyun09/inkvoy/tree/release/2.4.1) | [f1872573](https://github.com/Wyun09/inkvoy/commit/f18725737eceac9bbf8d41196cec587d39d1565a) |
| 2.4.2 | [release/2.4.2](https://github.com/Wyun09/inkvoy/tree/release/2.4.2) | [a45d648d](https://github.com/Wyun09/inkvoy/commit/a45d648d92a108ed00b150e3c77aaeab0665fff8) |
| 3.0.0 | [release/3.0.0](https://github.com/Wyun09/inkvoy/tree/release/3.0.0) | [233bc91a](https://github.com/Wyun09/inkvoy/commit/233bc91a61d4d113485c2df1235c93ee5e86bd83) |
| 3.1.0 | [release/3.1.0](https://github.com/Wyun09/inkvoy/tree/release/3.1.0) | [f32ba7bc](https://github.com/Wyun09/inkvoy/commit/f32ba7bc399a0b5f8433602d39bb434fdda5b76c) |
| 4.0.0 | [release/4.0.0](https://github.com/Wyun09/inkvoy/tree/release/4.0.0) | [e2a14387](https://github.com/Wyun09/inkvoy/commit/e2a14387116fa0a661fec6453c46b5ba09e646ad) |
| 5.0.0 | [release/5.0.0](https://github.com/Wyun09/inkvoy/tree/release/5.0.0) | [7940a0b7](https://github.com/Wyun09/inkvoy/commit/7940a0b74623cf710396f3f44f2543ca933bad90) |
| 5.1.0 | [release/5.1.0](https://github.com/Wyun09/inkvoy/tree/release/5.1.0) | [339934da](https://github.com/Wyun09/inkvoy/commit/339934daf271c7700ab3d01b2753f1f42b0752d0) |
| 5.1.1 | [release/5.1.1](https://github.com/Wyun09/inkvoy/tree/release/5.1.1) | [465e0c79](https://github.com/Wyun09/inkvoy/commit/465e0c79415c42f44d55da7730ad261247d81aad) |

## 缺少完整源码的版本

2.0.0、2.0.1、2.0.2、2.0.3、2.1.0 和 2.3.2 的完整原始源码未在本次本地清单中找到。保留的发布说明或安装包不等于完整源码；没有为这些版本伪造源码提交或版本分支。

## 文件范围

- 应用源码、锁文件、构建脚本、可保留的原生库、测试与许可证进入 Git。
- 私钥、登录资料、浏览器 profile、设备数据和构建缓存不进入 Git。
- 大型运行镜像、对应源码压缩档、APK 和演示视频由每版 EXTERNAL_ARTIFACTS.json 单独记录；GitHub Release 附件尚未上传。
- 每个恢复分支的 SOURCE_MANIFEST.json 校验该版选入的原始源码文件；history/original-source-manifest.json 保留原发布包的清单（如原包提供）。
- main 另有仓库文档和源码检查配置；需要确切发布快照时，使用相应 release/ 分支。

项目自有历史源码在本次公开导入时按项目所有者选择采用 GPL-3.0-only；第三方许可保留。
