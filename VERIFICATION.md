# 安卓本机桥 v0.3.0 验证记录

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| JS / DOM / UI / 协议 | 155/155 通过，0 失败、0 跳过 | test-results.log |
| 启动故障回归 | 4 项通过 | test/ui-startup.test.mjs |
| 思考开关 | 28 项通过 | test/reasoning-control.test.mjs |
| 发送控件 | 18 项通过 | test/send-control.test.mjs |
| 内置智能搜索 | 12 项通过 | test/web-search.test.mjs |
| Anthropic 协议 | 21 项通过 | test/anthropic.test.mjs |
| Schema 方言 | 3 项新增校验测试通过，覆盖新版语义 | test/core-protocol.test.mjs |
| 打包引擎集成 | 两种协议均真实点击发送；计数不提交网页 | test/mobile-bundle.test.mjs |
| 原生 HTTP | 22 项通过，主机真实 TCP | transport-results.log |
| 已安装 Claude Code | 2.1.285，实际 Write、文件匹配、tool_result 回传、退出 0 | claude-smoke-results.json |
| APK 编译与签名 | API 26+ / target 35，versionCode 5 | build-apk.log |
| 升级签名 | 与 v0.2.1 一致 | signature-comparison.json |
| Logo 与界面 | 生成 Logo 保留，连接页新增 Claude Code 配置复制 | branding/、preview/ |
| 安卓真机 / 真实账号 | 未验证，未连接设备 | 下列验证边界 |

APK 大小：427286 字节。SHA-256：`c8414af31af9e284de23569c6f255d26341c18d1e9e63f1d395b27137b72532b`。

JS/DOM 测试使用本地网页夹具；HTTP 测试在主机 JDK 上运行实际 LoopbackServer.java；Claude Code 使用生产 JS 协议引擎与确定性模型夹具，工具由已安装客户端实际执行。没有将这些测试视为安卓真机、真实账号、所有 Claude 功能或长期后台稳定性的证明。

界面预览为打包资源在桌面 Edge 中的渲染，使用模拟原生状态。APK 及源码归档在交付前检查资源哈希、核心来源哈希、原生 DEX、图标、签名、必需证据和私有材料。

请求体上限仍为 16 MiB；usage 为估算，缓存状态 unknown，无 Anthropic 真实思考签名。当前仍按独立请求创建网页对话，会话复用尚未实现。详见 FIX_0.3.0.md、CLAUDE_CODE.md。
