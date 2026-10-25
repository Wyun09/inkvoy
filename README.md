# DeepSeek 安卓本机桥 v0.4.0

在安卓手机上登录 DeepSeek 网页，并把网页操作转换成同一部手机可以调用的 OpenAI Chat Completions 和 Anthropic Messages 接口。两种协议共用端口、密钥、队列与网页登录状态。运行链路全部在手机上：

```text
手机兼容客户端
    ↓ http://127.0.0.1:8787/v1 + 手机生成的 Bearer 密钥
本 APK 的本机 HTTP 服务 + 协议引擎
    ↓ 安卓 WebView 的网页操作
https://chat.deepseek.com/
```

运行时不需要电脑、Termux、Root、ADB 或桌面 Harness。需要互联网连接 DeepSeek。安卓客户端若要执行工具，须具备它自己的工具执行能力；本桥只交出经过校验的工具请求。

**当前 v0.4.0 加入任务会话复用：同一任务的追问和工具往返沿用网页对话，只发送新增消息。** 保留 Anthropic 协议适配、自动发送、内置智能搜索、按钮启动修复和新 Logo。概览页可查看复用次数并选择下次开始新会话。验证记录见 VERIFICATION.md，变更见 FIX_0.4.0.md。安卓真机与真实账号仍需设备验证。

## 安装与使用

1. 将 `deepseek-android-bridge-v0.4.0.apk` 传到手机并安装。支持 Android 8.0 / API 26 及以上；要求 Android System WebView/Chrome 的 Chromium 版本达到 120。版本过低时应用会提示更新。
2. 打开「DeepSeek 本机桥」。应用会启动本机接口并显示概览；底部导航可以进入 DeepSeek 网页和连接设置。允许通知后可以从通知栏回到应用。
3. 进入「DeepSeek」页，在应用内的网页手动登录 DeepSeek，手动完成短信与网站要求的人机验证。手机拥有独立登录状态，不会导入电脑会话。
4. 回到「概览」，点「重新检测」，再点「接口自测」卡片。后者会真实发送“只回复 ANDROID_BRIDGE_OK”，必须看到成功结果才算手机首次基本验收通过。
5. 进入「连接」页，点 API 密钥右侧的复制图标，在手机上支持自定义 OpenAI 兼容 Chat Completions 接口的客户端中填写：

| 项目 | 值 |
| --- | --- |
| Base URL | `http://127.0.0.1:8787/v1` |
| Model | `deepseek-web` |
| API Key | 「连接」页复制的手机密钥 |
| 协议 | OpenAI Chat Completions |

Claude Code 在「连接 → 复制 Claude Code 配置」中直接复制，使用根地址 `http://127.0.0.1:8787`（不加 `/v1`）。详细配置见 [CLAUDE_CODE.md](CLAUDE_CODE.md)。`127.0.0.1` 指调用程序所在设备；电脑 Claude Code 需要端口转发，不能直接用电脑本机地址访问手机。

电脑可以关机。手机需要保持网络；客户端须允许访问本机 HTTP 地址。不要填电脑版的密钥。接口不提供浏览器跨域访问；网页客户端需要自己的后端。

概览中的「停止服务」会停止接口并移除前台服务通知。重开应用可再次启动。应用不会开机自启。清除应用数据或卸载会移除手机密钥及 WebView 登录数据。

## 能力与边界

- 文本、完整消息历史、OpenAI 形式的 `tools` / `tool_choice`、独立 `reasoning_content`、SSE 和估算 usage。工具 Schema 保留并执行 draft-07 / 2019-09 / 2020-12 校验。
- Anthropic `/v1/messages`：system、content blocks、`tool_use` / `tool_result`、具名 SSE、thinking 开关和长 MCP 名称映射。`/v1/messages/count_tokens` 为本地估算，不生成网页请求。支持 `?beta=true` 路径及 Bearer / `x-api-key` 认证。两种认证同时发送时必须均有效。
- Anthropic thinking/adaptive 映射为网页思考开关；没有 Anthropic 的签名状态，`usage_meta.thinking_signature` 为 `not_available`，不伪造签名。结构化输出、服务端执行工具等未实现能力明确报错。
- 复用桌面桥 v0.2.2 的核心；两个文件保持原文，browser.js 加入安卓会话/开关/提交钩子，protocol.js 加入 Schema 方言与规范化消息，dom-text.js 加入本轮回答边界。哈希与修改说明在 `CORE_PROVENANCE.json`。没有修改或重启桌面桥 / Harness。
- 一次只操作一个网页；最多等待 8 个请求。取消后等待旧页面清理，避免把旧回答混入下一轮。
- 工具封装校验失败或完全无输出时最多再尝试一次，两种恢复共用最多两次的预算。完全无输出等待 120 秒，总请求时限 600 秒（含排队）。已出现正文或原始思考时不走空响应重试。
- 手机请求体传输上限 **16 MiB**，超限返回 413；不截断历史。没有宣称手机实测过 1M token。
- 图片实现支持 PNG/JPEG/WebP 的 base64 data URL，每张不超过 10 MiB、最多 8 张，受整体请求上限约束。远程 HTTP(S) 图片 URL 明确返回 400。手机端图片上传采用 WebView FileList/DataTransfer + DOM 就绪检查；尚未在真实手机的 DeepSeek 上传链路验收。
- usage 按完整逻辑 API 历史进行字符启发式估算，图片 token 不计入；不是网页累计上下文或官方账单。物理提交可为增量，`usage_meta.conversation` 报告是否复用及发送消息数。网页没有暴露官方缓存统计，`usage_meta.cache.status` 为 `unknown`，不伪造命中数。
- 仍保留网页渲染、验证码、登录失效、限流和改版导致失败的可能。手机号与验证码只在网页中由你输入，不由桥处理。
- 自动发送会核对当前编辑器和待发正文，点击唯一可用发送按钮，再检查提交发生。同一提交最多点击一次；缺失、禁用、歧义或生成中明确报错。真实手机页面布局、文件上传与长期后台生命周期仍需设备验证。
- 智能搜索默认开启，在「概览 → 智能搜索」可调整。每次发送前应用并确认网页开关，无需外部搜索模型/API。网页自行决定是否实际检索，请求可用 boolean `web_search` 覆盖本次策略。Anthropic `web_search_*` 声明映射为网页搜索，不提供其原生结果块、引用格式和高级过滤语义。
- 默认自动复用：比对包含上次校验后 assistant 回复和工具 ID 的完整历史前缀；匹配时只发送新增消息、上传新增图片，工具定义未变时不重复发送。无需修改普通客户端配置。
- 最多保留 8 个任务关联；交错调用时恢复各自的网页 URL 并核对最后回答。只在内存保存历史指纹与页面锚点，进程结束后关联不保留。
- 相同首问不用于合并独立任务。客户端改写/压缩历史、会话丢失、关联被淘汰或出现歧义时，携带完整 API 历史开始新对话；不会把增量发进不匹配的旧会话。未发送草稿会保留并明确报错。
- 概览中的「会话复用 → 下次开始新会话」只清除本地关联，不删除网页历史。请求可传 `conversation_id` 隔离任务、`reset_conversation: true` 重置关联。没有 ID 时自动匹配；显式 ID 也需要历史前缀匹配，不会盲目拼接单条无历史请求。详见 FIX_0.4.0.md。

## 结构与构建

`app/src/main/java` 是原生界面宿主、前台服务、WebView RPC 和 loopback HTTP 服务；`js/ui` 是应用自带的离线界面；`js/core` 是复用的核心；`js/mobile-browser.js` 与 `js/engine.js` 是安卓适配；`app/src/main/assets` 是实际打进 APK 的隔离引擎。

没有把 Native JavascriptInterface 注入 DeepSeek 网页。它只存在于应用自带、禁止导航和外部资源的本地引擎 WebView；远程页面只接受限于 DeepSeek 来源的 DOM 操作。手机端密钥只存应用私有设置，APK 不带电脑或手机密钥。

在 Windows 上复现（Node.js 22+、PowerShell、网络连接）：

```powershell
npm.cmd ci --ignore-scripts
$phoneBuildTools = Join-Path $env:LOCALAPPDATA 'DeepSeekBridgeBuildTools'
& .\scripts\provision-android.ps1 -ToolsDirectory $phoneBuildTools
npm.cmd run build:assets
npm.cmd test
& .\scripts\test-transport.ps1 -Toolchain (Join-Path $phoneBuildTools 'toolchain.json')
& .\scripts\build-apk.ps1 -Toolchain (Join-Path $phoneBuildTools 'toolchain.json') -SigningDirectory (Join-Path $phoneBuildTools 'signing')
```

构建脚本直接使用 JDK 17、Android API 35 与 Build Tools 35.0.0，无需 Android Studio/Gradle。SDK 下载来自 Google，JDK 来自 Eclipse Adoptium，下载按官方元数据校验。构建依赖与 SDK 留在本地构建目录。签名密钥应保留在私有目录以便升级，不放入源码包。当前 APK 用本机测试签名签署，未发布到应用商店。

发布源码包已经包含核心。`npm.cmd run sync` 会拒绝直接覆盖已修改的 browser.js / protocol.js；维护者需手动合并后同步。`scripts/sync-tests.mjs` 同理，只用于从相邻工程同步现有核心测试。

已安装 Claude Code 的主机可运行 `node scripts/smoke-claude.mjs <隔离测试目录>`，或通过 `CLAUDE_TEST_BINARY` 指定可执行文件。该测试使用生产 JS 协议引擎与确定性模型夹具，实际调用 Write、检查文件及结果回传，并验证两次调用只使用一个夹具会话；不使用真实账号、不读写用户 Claude 设置。证据见 `claude-smoke-results.json`。

Android 的 WebView 是应用内网页组件，后台服务需遵循系统的前台服务与生命周期规则；前台通知不等于保证网页永不暂停。参考 [WebView 官方文档](https://developer.android.com/develop/ui/views/layout/webapps/webview)、[前台服务类型](https://developer.android.com/develop/background-work/services/fgs/service-types)。

第三方组件许可证见 `THIRD_PARTY_NOTICES.md`，也包含在 APK 的 `assets/NOTICE.txt` 中。

## v0.2.1 界面与思考开关

概览中的“深度思考”卡片会显示已开启、已关闭、待登录或未识别；点开可重新检测或“开启并测试”。连接页提供不含密钥与正文的诊断复制。新版沿用 v0.1.0 包名和签名，可直接覆盖安装，无需卸载；原有密钥与登录数据保存在同一应用数据目录。

预览见 preview/，为打包资源的桌面浏览器渲染，使用模拟状态。详细变更和测试边界见 UI_UPGRADE.md 与 VERIFICATION.md。

## v0.2.1 按钮修复与新 Logo

已修复本地 WebView 的 DOM Storage 未启用和界面主题读取异常导致按钮未绑定的问题。即使存储被关闭、拒绝或写满，主要界面操作仍可用。新增原生启动错误提示与重新载入入口。新 Logo 使用内置图像工具生成，已接入桌面图标和应用内标识；图像模型版本未核实，原图与提示词见 branding/。

源码包中已包含图标；需要从生成原图重新导出 Android 密度资源时运行 scripts/build-icons.ps1。新版本沿用旧包名和签名，无需卸载。
