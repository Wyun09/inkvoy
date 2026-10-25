# 安卓本机桥 v0.2.1 验证记录

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| JS / DOM / UI | 101/101 通过，0 失败、0 跳过 | test-results.log |
| 启动故障回归 | 4 项通过，修复前存储关闭用例失败 | test/ui-startup.test.mjs |
| 思考开关 | 28 项专项通过 | test/reasoning-control.test.mjs |
| 原生 HTTP | 15 项通过，主机真实 TCP | transport-results.log |
| APK 编译与签名 | API 26+ / target 35，versionCode 3 | build-apk.log |
| 覆盖安装签名 | 与 v0.2.0 一致 | signature-comparison.json |
| Logo | 内置图像工具生成，已接入 launcher 与 UI | branding/README.md |
| 界面预览 | 打包资源在桌面 Edge 渲染，模拟状态 | preview/README.md |
| 安卓真机 / 真实账号 | 未验证，未连接设备 | 验证边界 |

APK 大小：414999 字节。SHA-256：`01a5c20de42e953ddb2f87c6954645089dceb17c8e8fc978818aab96259a1416`。

JS 测试使用本地网页夹具；HTTP 测试在主机 JDK 上运行实际 LoopbackServer.java。没有用这些结果宣称手机账号已验证或后台永远可用。

APK 与源码包在交付前检查打包资源一致性、必需文件及私有材料。请求体上限仍为 16 MiB，图片限 PNG/JPEG/WebP base64 data URL；usage 为估算，缓存命中为 unknown。详细修复见 FIX_0.2.1.md。
