# 安卓本机桥 v0.4.0 验证记录

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| JS / DOM / UI / 协议 | 179/179 通过，0 失败、0 跳过 | test-results.log |
| 新增会话专项 | 24 项：16 项规划/引擎、8 项真实 DOM | test/conversations.test.mjs、test/conversation-dom.test.mjs |
| 网页多轮切换 | 四次正常调用交错两个任务，仅创建两个网页夹具会话；另测完整历史回退 | test/conversation-dom.test.mjs |
| 打包引擎 | 实际资源续接同一页面，验证增量消息、旧回答隔离、两种协议及不提交的计数 | test/mobile-bundle.test.mjs |
| 界面 | 复用次数、重置按钮、忙时禁用及窄屏触控尺寸 | test/ui.test.mjs |
| 启动/思考/发送/搜索/协议 | 既有回归继续通过 | test/ |
| 原生 HTTP | 22 项通过，主机真实 TCP | transport-results.log |
| 已安装 Claude Code | 2.1.285：实际 Write、文件匹配、tool_result 回传、退出 0，两个请求仅一个夹具会话 | claude-smoke-results.json |
| APK 编译与签名 | API 26+ / target 35，versionCode 6 | build-apk.log |
| 升级签名 | 与 v0.3.0 一致 | signature-comparison.json |
| 界面预览 | 实际资源 + 模拟原生状态，新增会话管理面板 | preview/conversation-sheet.png |
| 安卓真机 / 真实账号 | 未验证，未连接设备 | 下列边界 |

APK 大小：431382 字节。SHA-256：`5f914d80cc2381ece87f1ca1147858b088ad90d61a7257a49cb5f09c0b67a95c`。

JS/DOM 使用本地可控网页夹具；HTTP 在主机 JDK 上运行实际 LoopbackServer.java；Claude Code 使用生产 JS 协议引擎和确定性模型夹具，工具由已安装客户端实际执行。测试覆盖会话选择、实际网页点击、回答边界及工具执行，不能替代安卓真机、真实 DeepSeek 账号或长期后台验证。

APK 和源码在交付前检查资源哈希、核心来源哈希、原生 DEX、图标、签名、必需证据与私有材料。会话关联只驻留内存，最多 8 个；匹配失效时完整历史回退，重置不删除网页对话。usage 按逻辑 API 历史估算，缓存 unknown。详见 FIX_0.4.0.md。
