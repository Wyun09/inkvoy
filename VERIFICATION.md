# v2.3.1 验收记录

日期：2026-10-20。ARM64 完整离线测试版。adb devices 无设备，本轮未连接实体 Android 手机。

## 最终 APK

- deepseek-android-bridge-v2.3.1.apk：615,831,471 bytes。
- SHA-256：4f67703fe6044d6dcaa7ec5e4079ebf3488d81ce2a3594332a2e37eba3dc7fa5。
- io.github.deepseekbridge；versionCode 15；minSdk 26；targetSdk 35。
- v2/v3 签名校验通过，证书与旧版一致，可覆盖升级。
- 9 项 assets、5 个 ARM64 原生库与源码逐项 SHA 一致；DEX 存在，原始 ZIP 路径无 Windows 分隔符；ELF 至少 16 KiB 对齐。
- Android AssetManager 从本轮最终签名 APK 读取资源，并校验完整 Debian 镜像长度和 SHA。

## 本轮自动化结果

- 284 项 JS/协议/DOM/客户端/UI：0 失败、0 跳过。
- 105 项 Android 框架（API 26/33）：权限 5、图片附件 6、AI 浏览器 16、文件快照 20、原生 API HTTP 8、响应速度 6、安装包资源 10、硬链接 8、启动与 SQLite 12、常驻任务 14。0 失败、0 错误、0 跳过。
- 图片验证包含不可变副本、普通文件识别、私有路径限制、实际 image_url 内容、view_image 回传、不把 base64 保存进聊天状态，以及图片/文件卡片和全屏返回。
- 网页搜索工具与实际 DOM/引擎夹具联动：当前轮正文、来源链接、搜索过渡和完成后的内容返回。未使用真实 DeepSeek 账号。
- 问答使用生产 UI 和 Agent 循环：选项为草稿，提交后回传并自动继续；停止不发送答案；模型/API 设置在侧栏第一层。
- Computer use 以真实桌面浏览器页面验证 observe → click → type → click → 结果变化；Android 框架检查鼠标事件来源、主键、坐标、原生输入、过期观察、接管、持久日志去重和截图路径隔离。
- 浏览器异步旧状态不会覆盖较新页面事件；320px 工具栏可用，原生 WebView 按需创建。

模型回复、远端网页和部分 Native UI 状态使用明确的测试夹具。上述通过不等同于 Android 真机或真实远端模型验收。

## 常驻任务的回归证据

- 实际启动桌面主机的 Python HTTP 服务；启动调用返回后，两次独立 HTTP 请求均获得 200 和预期正文。明确停止后，连接被拒绝。
- 同一启动 ID 不重复创建子进程；不同参数冲突被拒绝，项目外查询和停止被拒绝；最多 4 个运行任务。
- stdout/stderr 缓冲与状态输出有上限；退出码和错误输出保留，普通列表不携带日志。
- 关闭服务期间，即使正有慢启动操作，主线程也不等待；新子进程仍被清理。无法正常退出时升级终止。
- 生产 UI 验证：任务跨页面保留，日志可见，预览链接走内部浏览器，只有明确停止才结束；320px 默认折叠面板保留终端区域。
- Agent 完成聊天不会对已经返回的常驻进程自动发送停止；批量工具中的图像消息只在所有工具结果之后进入请求，兼容旧存档顺序。

HTTP 生命周期测试使用真实的桌面主机子进程，未把它描述成 Android PRoot 或实体手机测试。Native Android 进程启动沿用应用原有 JNI 管道启动器，新的管理器保持其 PRoot 与管道生命周期。

## 功能边界与已知问题

- 图片附件真正作为图像消息传递；实际解码格式和视觉能力取决于系统与上游模型。原图保持不变，私有规范化 JPEG 长边最多 1600px；一轮发送最近最多 8 张图。聊天 JSON 导出仅含附件引用，不包含像素副本。
- 普通文件显示文件卡片，文本可打开编辑；未新增 PDF/Office 专用渲染器。
- 默认网页模型通过可见 DOM 与坐标控制 AI 浏览器；浏览器截图作为模型输入仅供自定义视觉 API 明确开启。网页不获得 JavaScript 原生文件桥。验证码由用户操作。
- web_search 使用已登录的 DeepSeek 网页，未配置外部搜索模型也可供自定义 API 模型调用；不保证第三方网页持续保持相同结构。
- 常驻服务器应使用新增 process 工具，以前台命令启动；一次性 terminal 仍保留子进程清理规则。任务跨模型轮次与 UI 页面，但 App 服务结束、系统杀进程或重启后不会自动恢复命令。日志为有界内存缓存。最多 4 项运行任务、24 条记录，状态与停止受项目归属校验。
- 保留上一版分段流式草稿和执行链；命令工具 stdout/stderr 仍随命令结果返回。
- 未验证真实 Android 13 覆盖安装、厂商省电/长期锁屏、真实 DeepSeek 登录后的图片与搜索、真实付费 API、完整 APK 反编译回编译链路。

## 视觉、来源和历史验证

本版新增 2 张常驻任务亮暗主题生产 UI 预览（preview/managed-231-preview.json）。此前 2.3.0 新增 5 张生产 HTML/CSS/JS 的桌面预览：AI 浏览器亮暗主题、侧栏、API 设置、问答卡片；原生 Android 页面与真实账号内容未作为截图来源。已有 22 张 2.2.0 预览保留。图片附件通过生产 UI 交互断言验证，当前未新增该页截图。

DeepSeek Harness 固定提交和 16 个实际审阅文件的 SHA 见 verification/harness-source-review.json。参考问答草稿/提交、问答区域和工具恢复语义，未复制上游源码或运行其测试。

上一版桌面 Edge 四倍 CPU 限速对照、Linux ARM64 QEMU 工具/PTY/取消、主机 TCP/存储/TAR/SQLite 日志证据保留；这些是历史证据，不作为本轮手机性能或实际内核执行结果。

## 清理与分发

已实际删除 65 个旧发行物/目录和重复构建项，共 36,188,836,922 bytes（33.70 GiB）。逐项确认路径已不存在，详见 verification/artifact-cleanup-231.json。

保留当前源码、2.3.1 最终发行物及已交付的 2.3.0 发行物、2.2.0 回退发行物、工具链、Debian/GPL 来源、签名身份、用户项目和桌面桥。新的大型发行物放在 D 盘。

源码 ZIP 使用固定公开目录允许清单，按每个条目 SHA 核对，附 SOURCE_MANIFEST.json；不包含私钥、用户登录、API 密钥、node_modules 或构建目录。源码打包的最终条目数和哈希记录在发行目录的 artifacts.json 和 SHA256SUMS.txt。

## 证据文件

- verification/javascript-tests.log
- verification/features-2.3.0.log
- verification/android-runtime-2.3.1.log
- verification/android-runtime-2.3.1-results.json
- verification/apk-build.log
- verification/apk-payload.json
- verification/artifact-cleanup-231.json
- preview/computer-230-preview.json

常驻任务专项与图像协议日志：verification/managed-ui-2.3.1.log、media-order-2.3.1.log。界面截图为明确 Native 夹具，不是手机截图。
