# DeepSeek 工作室 v2.4.2

在一个安卓 App 中聊天、操作项目文件、运行真实 Linux 终端，并让内置 Agent 执行工具后自动继续。手机独立运行，电脑可关机。默认模型复用应用内已登录的 DeepSeek 网页，无需外部 API。也可从侧栏第一层「模型与 API」、工作台同名入口或输入框模型按钮添加自己的 OpenAI 兼容 API、模型 ID 与密钥。

完整离线 APK 包含 Debian 13 ARM64 用户空间和预装工具。首次初始化只检查空间、校验 SHA-256 和解压；不会在手机上逐个下载必需工具。模型聊天和 DeepSeek 网页搜索仍需联网。

## 2.4.2 紧急修复

修复 Android 输入法线程触发的手动输入闪退。中文组合输入、文字提交和删除保持 Chromium 原始输入线程；应用状态和 WebView 读取只在主线程执行。崩溃诊断显示真实安装版本。默认 Agent 不再因 30 轮预算中断。详见 FIX_2.4.2.md。

## 2.4.1 历史更新

强化浏览器点击与输入：稳定控件 ref、目标校验、导航等待、追加与替换输入、清空、Unicode 前后删除，以及可见光标。手动触摸只取消当前浏览器步骤，后续 AI 权限保留；明确接管仍可停止任务。

新增浏览器与对话分屏、可拖动分隔条、双指与按钮缩放，以及自动/竖屏/横屏方向偏好。旋转保留网页和对话实例。设置弹层会收起原生网页层，避免遮挡。

修复网页图片上传卡住：输入区独立识别附件，支持无文件名缩略图，大图分块、解码后上传，完成后只发送一次。自定义 API 打开就能填写地址、密钥和模型 ID。详见 FIX_2.4.1.md。

## 2.3.1 历史更新

修复开发预览服务无法跨工具调用存活的问题。新增由 App 服务持有的 `process` 工具，支持 start/status/list/stop；Python、Vite、Node 等服务器以前台命令运行，启动调用返回后继续存活，不再依赖 nohup、setsid 或 &。

终端页新增可折叠的「常驻任务」：状态、近期日志、打开本机预览、停止和手工启动入口。AI 完成回复或切换页面不会停止服务。服务只在主动停止、App 服务结束或系统杀进程时结束；不自动恢复执行任意命令。

让 AI 使用 process 启动服务后，仍需独立检查 HTTP 是否就绪。详见 FIX_2.3.1.md。保留本轮图片、文件、网页搜索、问答、浏览器和 API 配置入口升级，并修复同批工具中图片消息过早插入导致的协议顺序问题。

## 2.3.0 历史更新

新增独立 AI 浏览器（可见光标、点击、输入、滚动与接管）、DeepSeek 网页搜索工具、提交后才继续的问答卡片，以及聊天中的图片预览和文件卡片。图片真正进入模型上下文，Agent 可用 view_image 查看项目图片；自定义 API 的上游仍须支持视觉。

「模型与 API」已放到侧栏第一层和工作台。搜索不再依赖终端 curl 或外部搜索模型；搜索工具可供自定义 API 模型调用，实际搜索仍使用已登录的 DeepSeek 网页。

2.3.0 当时按要求先交付已合入的功能；其一次性命令中的后台服务器问题已由 2.3.1 新增的 process 常驻任务工作流处理。一次性 terminal 本身仍保留清理规则。

## 2.2.0 历史更新

回复改为按真实顺序呈现的执行链：一段说明 → 对应工具与结果 → 下一段说明 → 最终回复。当前工具高亮，长说明和日志独立展开；保留阅读位置、代码复制、高亮、表格、文件 Diff 与撤回。

内置客户端在网页生成期间逐段显示当前轮正文与思考，允许网页修订尚未提交的草稿。工具必须等完整协议和参数校验后执行。搜索卡片与正文分开识别，支持搜索后仅显示复制/重新生成按钮的完成形态，搜索未结束或仍在生成时不会提前完成。

同步加密写入改为后台写入与异步确认；工具和模型的关键执行边界仍等待记录持久保存。界面状态读取不等待磁盘写入，重复布局和主题操作被合并。UI 保留浏览器原生计时器，后台任务使用 Android 计时器。聊天首次只挂载最近 20 轮，旧对话可逐页加载，折叠工具日志按需构建。

小墨使用图像生成工具制作的 4 × 8、共 32 帧透明素材，包含待机、思考、阅读、终端、写入、完成、异常和等待。移除暗色主题垫板，增加状态耗时与轻量过渡；离开聊天、页面不可见或选择减少动态效果时暂停相应动画。

新增「模型与连接」：最多保存 8 个 OpenAI 兼容接口，支持基础地址或完整 Chat Completions 地址、模型 ID、可选 Bearer 密钥、模型列表、真实 SSE、停止生成和本机 Agent 工具。密钥使用独立 Keystore 加密文件，不进入聊天保存或导出。默认网页搜索仍可直接使用；自定义 API 的思考参数可在兼容选项中启用。

本轮 263 项 JS/协议/DOM/客户端/UI、69 项 Android 框架、23 项文件/TAR 和 32 项 SQLite 日志断言全部通过。桌面 Edge 四倍 CPU 限速的 60 轮夹具中，界面更新中位耗时 34.6 → 6.5 ms，重复刷新布局回调 100 → 0；这些数字不是手机实测帧率。见 `VERIFICATION.md` 与 `FIX_2.2.0.md`。

## 安装和开始

1. 安装 `deepseek-android-bridge-v2.4.1.apk`。包名 `io.github.deepseekbridge`，versionCode 18，与本项目 v1.0.0 使用同一签名，可覆盖升级。要求 ARM64 Android 8.0 / API 26+、Chromium 120+ 的系统 WebView。无需 Root、Termux、电脑或桌面 Harness。
2. 默认网页连接：打开左上角侧栏的「DeepSeek 网页」，在应用内登录；验证码和人机验证由用户完成。自定义 API：打开侧栏第一层「模型与 API」（工作台同名入口、输入框模型按钮也可）→ 直接填写地址、密钥和模型 ID → 保存并使用。
3. 回「对话」直接提问。点击输入框下方的选项按钮可切换 Agent、深度思考和搜索；默认 Agent 和搜索开启。回复在生成时逐段更新，工具在校验通过并保存记录后执行，等待时显示实际阶段和耗时。
4. 使用终端或 Agent 的终端工具时，首次解压 Debian；也可到侧栏「工具与环境」手动初始化。保持应用前台，等待进度完成，再点「运行自检」。实际镜像大小和空间要求见 `app/src/main/assets/runtime/manifest.json`。
5. 点输入框「＋」选择图片或文件，发送前可预览和移除；消息中图片可点击放大，普通文件显示卡片。让 AI 查看现有项目图片时可使用 view_image。
6. 从侧栏或输入框打开「AI 浏览器」，可手动浏览或让 Agent 操作；触摸网页时由你优先，AI 保留后续操作权限；点击「接管并停止」可明确停止。浏览器右上角可开分屏，工具栏可缩放和选择屏幕方向。需要搜索时直接提出问题，web_search 会调用 DeepSeek 网页并回传结果。
7. 在「终端」运行 Bash、Python、Node、Git 等，或从「文件」导入 APK/DEX/JAR/SO，点文件旁的「分析」。产物保存到当前项目的 `analysis/`，可查看、编辑和导出；二进制文件也可直接导出。

清除应用数据或卸载会删除应用私有项目、聊天、密钥和网页登录状态。覆盖升级时项目与版本化环境分开保留。旧版网页桥的关联记录仍使用原存储；v2 内置聊天使用独立的 Keystore 加密存储。v1 的内存聊天不会凭空迁移为内置聊天。

侧栏「设置与权限」可分别开启所有文件访问、服务通知和后台电池豁免。Android 的其他应用私有目录仍不可访问。授权共享存储后请新开终端，在 `/shared` 查看；原项目仍在 `/workspace`。

## 常驻预览服务

让 AI 使用 `process` 的 start 启动前台命令，再通过独立 terminal 请求或 AI 浏览器确认 HTTP 就绪。也可打开「终端 → 常驻任务 → 新建常驻任务」，例如命令 `python3 -u -m http.server 8899 --bind 127.0.0.1`、工作目录 `ui-kit`、预览地址 `http://127.0.0.1:8899/`。工作目录相对当前项目，必须存在。

不添加 nohup、setsid 或 &；在面板中查看日志和停止。最多 4 项运行任务，记录和日志有上限。切换页面与 AI 完成回复不终止服务，强停 App、系统杀进程和重启则需要重新启动；不承诺绕过厂商后台限制。

## 已实现的工作流

- 内置聊天与 Agent：模型请求工具 → 本机真实执行 → SQLite 保存结果 → 回传模型 → 自动下一轮。默认不设置模型轮次上限，仍可主动停止；错误、明确等待用户和中断恢复均保留保护；完成、等待补充、停止和失败分开显示。
- 工具身份：调用 ID 和规范化参数建立持久记录。同 ID 已完成的结果重放；参数冲突和未知执行状态报错。重开应用不会自动重跑工具；恢复使用原 ID 检查日志，防止重复副作用。
- 真实命令：分离 stdout/stderr、退出码、超时、取消、耗时与输出截断。终端工具最长 600 秒；每个输出流保留 128 KiB。取消使用 PRoot 的 SIGQUIT 清理机制，原生启动器解除 Java 继承的信号屏蔽。
- 交互终端：原生 PTY、xterm.js、中文/Emoji 输入、窗口调整、Ctrl-C/Ctrl-D、Tab/方向键、键盘、粘贴、复制、清屏及最多 4 个终端。界面渲染器重建可重新附加仍存活的 PTY；进程被系统杀死后不宣称 shell 可以原地恢复。
- 项目文件：应用内独立项目、文件树、UTF-8 编辑、原子保存、文字搜索、系统文件选择器导入/导出。文本编辑限 1 MiB，写入限 2 MiB；导入单文件限 512 MiB。更大或二进制内容使用终端处理。
- 会话：最多 32 个内置会话，可命名、置顶、归档、导出 JSON 和删除。删除聊天保留项目文件和网页历史。同任务传递稳定 conversation_id，历史一致时复用网页对话；压缩或改写历史不强行拼接。
- UI：紧凑聊天与侧栏、按时间排列的执行链、可修订流式草稿、独立展开的工具结果、按需高亮/复制/表格、真实文件 Diff 和冲突保护撤回、透明 32 帧小墨与减少动态效果支持。
- 外接桥：保留 OpenAI Chat Completions、Anthropic Messages、工具协议、网页思考/搜索开关和自动发送。外接客户端的工具和任务循环仍由该客户端执行。

内置网页客户端使用可修订的流式草稿；对外网页 API 的工具请求默认采用稳定输出策略：等待完整协议校验后再交付，容忍网页生成期间改写正文或思考。它会延后首段展示；不会加速 DeepSeek 生成。显式 `bridge_output_mode: "live"` 保留即时流模式。

## 镜像内工具

| 用途 | 已固定的版本 |
| --- | --- |
| Debian ARM64 | 13 / trixie，完整包清单 `third_party/packages.tsv` |
| APK/DEX 到 Java | JADX 1.5.6 |
| Manifest、资源和 Smali | Apktool 3.0.3 |
| DEX 拆装 | smali / baksmali 2.5.2.git2771eae |
| Java class/JAR | CFR 0.152 |
| ELF/SO 反汇编和伪代码 | radare2 6.2.4 + r2ghidra 6.2.4 |
| 开发环境 | Bash 5.2.37、Python 3.13.5、Node 20.19.2、npm 9.2.0、Git 2.47.3、OpenJDK 21.0.12.1 |
| 基础分析/构建 | file、strings、readelf、objdump、xxd、cc/c++、make、curl、zip/unzip 等 |

已验证样例覆盖 Java 源码、资源/Smali、DEX 回组装、JAR 反编译和 ELF 函数伪代码。Apktool 的 APK 完整重建仍需要单独验证 ARM64 aapt/aapt2 链路；本版不宣称已验收该功能。反编译本身也不保证恢复所有代码。

## 外接客户端

本机桥端口为 8787，只监听手机回环地址；「工作台 → 连接配置」可复制本机生成的密钥和配置。

- OpenAI Base URL：`http://127.0.0.1:8787/v1`，模型 `deepseek-web`。
- Claude Code / Anthropic 根地址：`http://127.0.0.1:8787`，不加 `/v1`；使用连接页的专用复制按钮，详见 `CLAUDE_CODE.md`。
- 内置客户端直接调用本机引擎，不需要填写这些配置。

网页没有提供官方 prompt cache 统计；usage 为估算，cache 保持 unknown，不伪造命中数。一次只驱动一个 DeepSeek 网页，多个请求排队。网站改版、登录失效、限流和验证仍可能影响调用，错误会保留具体状态。

## 验证范围

详见 `VERIFICATION.md` 和 `verification/` 的日志。已通过协议/DOM/UI/客户端测试、Java TCP/存储/SQLite/文件归档测试，以及 Linux ARM64 QEMU 中的实际反编译和原生 PTY/取消测试。

本次没有连接安卓手机。Android 目标 SDK 35 的真实启动、Keystore、登录后的 DeepSeek 调用、首次离线解压、覆盖安装、锁屏与系统回收仍未完成真机验收。桌面界面预览使用生产 HTML/CSS/JS 和明确标注的 Native 测试数据，不代表手机截图。原生 ELF 已检查 16 KiB 对齐；这也不替代 16 KiB Android 真机测试。

## 构建

源码包含 APK 内的离线镜像、原生启动器、对应第三方源码和固定哈希；不含签名私钥、用户账号或构建 VM 密钥。

```powershell
py --version # 构建需要 Python 3，使用它正规化 APK ZIP 原始条目路径
npm ci
npm run build:assets
npm test
.\scripts\provision-android.ps1 -ToolsDirectory C:\build\android-tools
.\scripts\build-apk.ps1 -Toolchain C:\build\android-tools\toolchain.json -SigningDirectory C:\build\private-signing
```

构建和发行物可通过 `-BuildDirectory D:\build\studio -ArtifactDirectory D:\releases\studio` 放到有足够空间的磁盘。验包与源码打包脚本对应支持 `--artifact-directory`。

签名目录缺失时脚本生成本地测试签名；只有使用原签名才能覆盖原安装。`-CompileOnly` 仅检查 Java/DEX，不产出可分发 APK。缺少镜像、大小或 SHA-256 不符时，正式构建会拒绝。

更新原生 PTY：安装 NDK r28c 后运行 `scripts/build-native.ps1 -NdkDirectory ...`。复现 Termux 启动器运行 `py scripts/runtime/prepare-native.py <缓存目录>`；它验证固定包哈希并完成 talloc 名称补丁。

重建 Debian：在专用 Debian ARM64 构建机/QEMU 中准备样例，再执行 `scripts/runtime/build-image.sh`、工具自检与 `finalize-image.sh`。包版本记录在清单中；滚动的 Debian trixie 仓库可能产生不同版本，随附离线镜像是本次发行物的精确基准。`fetch-debian-sources.py` 可取得 `packages.tsv` 对应的完整 Debian 源码文件并验证哈希。

PRoot 是共享 Android 内核的用户空间环境，不提供独立内核、完整 systemd 或安全沙箱。Agent 模式可执行真实命令，文件工具路径限制也不是命令沙箱。新项目需要的额外依赖按项目需求安装，不影响本次预装工具离线可用。

## 自定义 API 连接

协议为 OpenAI 兼容 Chat Completions。地址可填 `https://example.com/v1` 或 `https://example.com/v1/chat/completions`；也可使用本机模型服务的 HTTP 地址。`获取模型` 请求同一 API 基础地址的 `/models`，没有模型列表的服务仍可手填模型 ID。可在 [DeepSeek 官方协议说明](https://api-docs.deepseek.com/api/create-chat-completion/) 查看这种请求与 SSE 数据结构。

上游密钥只发给所填端点，HTTP 重定向不会自动跟随。设置与聊天使用不同的 Keystore 加密文件；配置不会写进提示词、聊天导出、项目文件或公开源码。思考参数使用 `high` / `none`，须在该连接的兼容选项明确启用。Agent 工具还要求上游支持标准 `tool_calls`；接收完整参数并通过本机 schema 校验后才执行。

此连接选择用于内置客户端。应用对外的本机网页桥端点继续提供原有 DeepSeek 网页服务。
