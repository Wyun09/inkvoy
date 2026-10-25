# v3.0.0 验收记录

日期：2026-10-21。ARM64 完整离线测试版。未连接实体安卓设备，未使用真实 DeepSeek 或 OpenAI 账号。

## 最终 APK

- `deepseek-android-bridge-v3.0.0.apk`：616,007,806 bytes。
- SHA-256：`c0e385ecf49762334612da0c9711202cf158703b17526675a30eeae18a85a13d`。
- 包名 `io.github.deepseekbridge`；versionCode 20；minSdk 26；targetSdk 35。
- v2/v3 签名通过，证书与旧版相同。覆盖安装的签名条件满足，实际手机覆盖安装尚未验收。
- 12 项 assets、5 个 ARM64 原生库逐项 SHA-256 与源码相同；真实 DEX、原始 ZIP 路径、ELF 16 KiB 对齐通过。
- Android AssetManager 从最终签名 APK 读取并验证完整 Debian 镜像的长度及 SHA-256。
- 机器记录：`verification/apk-payload.json`、`verification/regression-300.json`。

## 完整回归

- JS、协议、DOM、客户端、浏览器和界面：309 项，0 失败、0 取消、0 跳过。
- 最终 APK 的 Android 框架 API 26/33：161 项，0 失败、0 错误、0 跳过。
- 分类：权限 5，IME 线程 6，图片 8，浏览器 34，显示方向 4，MCP/插件 12，文件快照 20，常驻任务 14，OpenAI 授权 14，HTTP API 8，响应速度 6，APK 资源 10，硬链接 8，启动与 SQLite 12。
- 最终日志和哈希收录在 `verification/`；逐测试类统计在 `regression-300.json`。

## 本轮验证内容

- 使用生产 PageWebView 的 InputConnection 包装器，从真实 HandlerThread 调用提交文字、组合输入、删除和密集输入。确认没有在 IME 线程读取 WebView，原输入处理仍被调用；已关闭页面的迟到输入不会重新发状态。
- 默认电脑 User-Agent 与模式；切换为手机模式后重建对象仍保留用户选择。未把 Linux 桌面 UA 错误断言为 Windows UA。
- 实际浏览器渲染器上运行稳定 ref 的点击、替换/追加文字、清空、Unicode 删除、受控输入、取消 beforeinput、遮挡检测和只点击一次。不同文档、改变的目标、接管及不可靠 canvas 坐标被拒绝。
- 官方 MCP SDK Worker 连接本机真实 Node HTTP MCP 服务和真实 Node stdio 子进程，验证握手、工具目录、工具调用、资源、提示词、拆分 Unicode 流、取消且不自动重试。Worker 测试中的 Native 传输为明确适配夹具；原生层另用真实 TCP 服务和受控双向管道验证。
- MCP 工具完成结果持久重放；持久记录结果未知时不重新执行；记录期间取消不允许迟到副作用。MCP 图片在原生层转为真实项目文件和不可变聊天像素，持久日志不保存 base64。
- 插件清单、导入时停用、启停/移除、技能内容、端点验证、密钥省略和 ZIP 越界拒绝。未声称兼容所有第三方宿主 hooks 或界面组件。
- OpenAI 使用真实回环 Socket 回调和测试 RSA 签名验证 state、PKCE、nonce、受众、签名与有效期；错误回调不换令牌。多账号隔离、重新授权身份检查、串行刷新、退出撤销失败提示通过。
- Responses SSE 在完成前产生正文；保留加密推理项和工具 ID 配对，拒绝不完整的工具参数；限额/失败不显示完成。使用测试响应流，未调用付费服务。
- 界面覆盖四档比例和横竖屏，原生浏览器矩形跟随实际缩放布局；模型切换、保存和编辑，账号入口与模型选择，MCP 表单保存/移除，插件选择器均通过实际点击验证。
- 通过默认 Agent 超过 30 轮自动继续的回归；显式停止、提问等待、错误和未知工具状态仍保留边界。

## 性能与画面

在回归结束后，使用桌面 Edge、390 × 844、CPU 四倍限速和同一份 60 轮历史。每个版本两次、每次 25 个更新样本，第二次反转版本顺序；两个版本都只挂载最近 20 轮，DOM 元素数均为 805。

| 度量 | 2.4.1 签名包 | 3.0.0 |
| --- | ---: | ---: |
| 同历史界面更新中位耗时 | 11.3 ms | 4.3 ms |
| P95 | 16.4 ms | 6.9 ms |
| 无变化刷新引发的原生重复布局 | 0 / 0 | 0 / 0 |

这是合成历史的桌面界面渲染耗时，不是安卓帧率、真实网络响应时间或端到端触摸延迟。完整数据为 `verification/ui-performance-300.json`，可运行 `scripts/benchmark-upgrade.mjs` 复现。

`scripts/preview-upgrade.mjs` 从最终生产资源生成 8 张画面，等待动效稳定后截图；聊天、执行链、配置表单、侧栏、账号、MCP 和深色设置均已查看。它们使用明确的 Native/模型夹具，不是手机截图。见 `verification/ui-previews-300.json` 与 `preview/3.0.0/`。

## 尚未完成的外部验收

真实安卓 13 的安装、系统键盘、网站登录、OpenAI 账号授权和计划模型调用、MCP 在 Android PRoot 中启动、DeepSeek 图片上传、锁屏/系统回收及厂商后台策略尚未用实体手机验收。框架测试与桌面组件联调不会被记为真机通过。

离线镜像与 Debian 对应源码保持原版。本轮没有重复运行历史 QEMU 反编译工具检查；历史记录仍保留，新的 Native 启动器已以 Android NDK 编译并检查打包哈希及对齐。`runtime-image.json` 中旧 Native 哈希属于当时的基线，新版以 `apk-payload.json` 和 `native-300.json` 为准。
