# v2.2.0 验收记录

日期：2026-10-19。ARM64 完整离线测试版。本轮 adb 没有连接实体 Android 手机。

## 最终 APK

- deepseek-android-bridge-v2.2.0.apk：615,794,532 bytes。
- SHA-256：fe554434e51af4a7efefc5dd19bcc0e463e5ee435bfe561e2618c61d66191a79。
- io.github.deepseekbridge；versionCode 13；minSdk 26；targetSdk 35。
- v2/v3 签名通过，与先前版本证书一致。
- 8 项 assets 和 5 个 ARM64 原生库 SHA 与源码一致；原始 ZIP 路径无 Windows 分隔符，ELF 至少 16 KiB 对齐。
- Debian 工具镜像保持原哈希。Android AssetManager 读取最终签名包并校验完整镜像长度和 SHA。

## 自动化结果

- 263 项 JS/协议/DOM/客户端/UI，0 失败、0 跳过。
- 69 项 Android 框架（API 26/33）：启动与 SQLite 12、权限 5、安装包资源 10、硬链接 8、文件快照 20、响应速度 6、原生 API HTTP 8。全部通过。
- 23 项文件/TAR 主机断言、32 项工具日志 SQLite 断言通过。
- 写入锁被占用时，UI 状态/读取仍返回；同内容不重复加密；100 次相同槽位更新不重复布局/抬升 WebView。
- Java HttpURLConnection 连接本机 HTTP 夹具，验证 SSE 首段早于响应完成、UTF-8、GET 模型列表、错误密钥隐藏和重定向拒绝；收到 `[DONE]` 后即使上游连接仍打开也能结束本轮。
- JS/API 验证 CRLF SSE、分段工具参数、schema 拒绝、停止、固定端点、独立密钥保存、缺失用量时不伪造缓存。
- 打包界面与远端网页夹具联动，验证完成前显示首段、草稿修订、最终 SSE 提交、搜索过渡与新完成控件。
- 执行链验证每段说明与其工具的 DOM 顺序、独立展开、最终回复在链尾和阅读位置。

## 性能对照

桌面 Edge，390×844 CSS 像素，4 倍 CPU 限速，60 轮合成聊天。旧资源从此前签名的 2.1.0 APK 提取。

| 指标 | 2.1.0 | 2.2.0 |
| --- | ---: | ---: |
| 100 次重复刷新额外原生布局通知 | 100 | 0 |
| UI 更新中位耗时 | 34.6 ms | 6.5 ms |
| UI 更新 P95 | 38.9 ms | 8.4 ms |
| 首次挂载的回复轮次 | 60 | 20 |
| 提前构建的隐藏日志代码块 | 120 | 0 |
| 聊天区域元素 | 63,840 | 805 |

这是受控夹具中的界面工作量和渲染调用耗时，不是实体 Android 帧率或端到端点击延迟。完整样本见 verification/ui-performance-220.json。

## 视觉与素材

本轮 22 张生产 UI 桌面预览，另保留 5 张先前版本历史图片。新预览覆盖执行链工作中/完成、亮暗主题、320px、文件、终端、Diff、模型设置和小墨状态。

新小墨素材 887×1774，4 列×8 行，32 帧。内置图像生成工具参照原图编辑，模型版本未公开。透明通道及无主题垫板已检查。实际动画采样含至少 3 个不同栅格帧；页面暂停与减少动态效果有测试。出处见 branding/companion-motion-origin.json，帧采样见 preview/upgrade-220-preview.json。

## 边界

本轮未验证实体 Android 13 覆盖安装、长期锁屏、厂商省电、真实 DeepSeek 搜索会话或真实付费 API。HTTP、页面、模型内容与截图使用明确的测试夹具。

正文和实际思考是流式展示。命令工具 stdout/stderr 仍随执行结果返回，交互终端保持原有 PTY。终端任意文件改动不自动保存快照。文件快照大小、保留数量和后续修改冲突保护不变。

自定义接口使用 OpenAI 兼容 Chat Completions，模型 ID 可手填；参数能力由上游决定。内置连接选择不替代对外网页桥服务。

## 日志和源码

verification/javascript-tests.log、android-runtime-2.2.0.log、android-runtime-2.2.0-results.json、apk-build.log、apk-payload.json、ui-performance-220.json、provider-chain-ui-2.2.0.log。

DeepSeek Harness 官方上游的固定提交、实际审阅文件和手机端差距记录见 verification/harness-source-review.md、harness-source-review.json。此项是源码审阅；本轮没有引入完整 Cordis/Node 运行时或复制其源码。

先前 Linux ARM64 QEMU 的 26 项工具、14 项原生执行/PTY/取消、完整镜像提取与提取后工具检查证据保留；不作为本轮手机验证。

源码包含完整离线镜像、对应 Debian/GPL 来源、MIT UI 参考、第三方许可与素材来源。ZIP 按条目核对 SHA，附 SOURCE_MANIFEST.json，排除签名私钥、用户登录、私有密钥与 node_modules。
