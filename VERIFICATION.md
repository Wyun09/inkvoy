# 安卓本机桥 v1.0.0 验证记录

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| JS / DOM / UI / 协议 | 200 项通过，0 失败、0 跳过 | test-results.log |
| 会话与任务恢复 | 新引擎加载序列化状态，再校验真实 DOM；交错任务复用及完整历史回退 | test/conversation-dom.test.mjs、test/tasks.test.mjs |
| 严格 Agent 协议 | 进度回复不直接结束；修复预算与 needs_input / tool 校验 | test/tasks.test.mjs |
| 幂等重放 | JSON / SSE / Anthropic 原帧、工具 ID、请求冲突、旧响应不覆盖新状态 | test/tasks.test.mjs |
| 任务 UI | 筛选、取消、重试、原客户端引导、会话管理、320px 和宽屏触控 | test/workbench-ui.test.mjs |
| 原生 HTTP | 35 项通过，主机真实 TCP，含任务认证与中断错误 | transport-results.log |
| 加密文件 | 11 项通过，主机 AES-GCM，含错误密钥、篡改、随机 IV、原子写入与大小上限 | storage-results.log |
| 已安装 Claude Code | 2.1.285，实际 Write、真实 tool_result、退出 0，两次调用一个夹具会话 | claude-smoke-results.json |
| APK 编译签名 | API 26+ / target 35 / versionCode 7，与 v0.4.0 同签名 | build-apk.log、signature-comparison.json |
| 界面预览 | 打包后 HTML/CSS，模拟原生状态；已查看明暗主题、任务与时间线等截图 | preview/ |
| 安卓真机 / 真实账号 / Keystore / 锁屏后台 | 未验证，当前设备列表为空 | 以下边界 |

APK 大小：447765 字节。SHA-256：`7fd8fb2b3593aa5a64742d9f2149796f4546835f6062f552e183ec57d54be309`。

网页操作与协议测试使用本地可控页面；加密、TCP 测试在主机 JDK 上运行生产 Java 类；Claude Code 工具由已安装客户端实际执行，但模型返回是确定性夹具。这些证据不能替代安卓 Keystore、真实 DeepSeek 账号、手机文件上传、渲染进程恢复与长期后台验收。

任务快照与会话文件有容量上限；存储失败时显示内存运行状态。客户端必须防止工具重复执行。任务结果读取不等于部分 SSE 自动续传；网页不提供官方缓存统计，usage 为估算、cache 为 unknown。详细约定见 UPGRADE_1.0.0.md。

交付前另核对 APK 与已测试资源哈希、原生 DEX、生成的图标、源码来源和私有材料。v0.4.0 安装包与源码保留；不改动或重启桌面 Harness / 桌面桥。
