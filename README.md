# Inkvoy 5.1.1

修复 Android 13 打开无障碍设置时因受限详情页权限导致的闪退。改用公开设置入口，系统拒绝或页面缺失均安全回退；无可用入口时显示手动进入路径。沿用包名和签名，可覆盖安装。详见 FIX_5.1.1.md 和 VERIFICATION.md。

自有代码采用 GPL-3.0-only；第三方组件保留原许可证。


Android 手机上独立运行的 AI 工作台，面向编程、安全研究与逆向分析，集成 Debian 终端、文件、AI 浏览器、MCP、技能与多模型协作。

An on-device Android AI workspace for coding, security research, and reverse engineering, with a terminal, AI browser, MCP, and multi-model agents.

仓库：https://github.com/Wyun09/inkvoy 。版本历史正在从保存的源码快照导入。

## 5.1 更新

- 抽屉「开始使用」：四步连接与工作环境引导，可跳过并随时重开；自定义 API 打开真实地址、密钥、模型编辑表单。
- 抽屉「App 操控」：由用户启用系统无障碍服务、选择 App 和允许本次操控。悬浮按钮可立即暂停。节点读取、点击、输入、清空、滚动、手势与 Android 11+ 系统截图；截图进入对话和模型图像输入，也保存在项目 captures/ 中。
- 抽屉或账号页「网络与代理」：跟随系统/VPN，或填写实际 HTTP 代理主机和端口；分别诊断授权与 API 域名，保留已授权身份。不预设 VPN 端口，不关闭 TLS 校验，不宣称已修复手机 DNS。
- 「阅读与辅助」：回复/思考字号、增强对比度、大点击区域、TalkBack 阶段通知及减少动态效果。手机面板适配界面缩放。
- 延续完整 Logo 动效、即时流式、命令实时输出、上下文、计划/目标、子代理和端点集群。

完整离线 APK 约 588 MiB，含 Debian ARM64；包名和签名延续旧版，供覆盖安装使用。尚未进行实体手机覆盖安装和其他 App 操控验收。

构建：npm ci → npm run build:assets；完整安装包使用 scripts/build-apk.ps1 与本机 Android 工具链/自行配置的签名。公开源码不含私钥、账号令牌或浏览器会话。检查见 VERIFICATION.md，设计见 DESIGN_5.1.md，上游差距见 HARNESS_PARITY.md。

历史快照与安全清理条件见 GITHUB_MIGRATION.md；已确认仓库后，仍须验证远端和全新 clone 恢复，再清理重复旧源码。宣传片源稿在 branding/promo.html 和 scripts/render-promo.mjs；界面素材是注明的示例任务演示。

## 5.0 更新

- 白色 / 石墨色默认风格，手机四项底部导航、桌面窄侧栏与紧凑密度。原图生成的透明 Logo 增加 13 类状态形态，Inky 与真实任务状态同步。
- 输入框 `/` 命令、`@` 引用、收起草稿、上下文面板与分块压缩。保留完整原始会话，支持恢复与分支。
- 目标与验收条件、只读计划模式、编辑步骤与批准执行；真实子代理、Agent Team 任务板与多模型 API 端点集群，支持并发、取消和报告汇总。
- 命令执行时显示标准输出与错误输出，结束显示退出码、持续时间、超时和截断；支持换行、复制及手动折叠。
- AI 和手动浏览器页面脚本，支持 await/return；默认沉浸全屏，并修复早期窗口初始化问题。
- 账号网络错误保留身份授权，模型目录读取可重试和诊断。DNS / VPN 配置仍由手机系统控制。

完整离线 APK 约 588 MiB，包含 Debian；包名和签名延续旧版，供覆盖安装使用。请保留现有安装，直接安装新 APK。当前没有实体手机覆盖安装验收。

执行 `npm ci`、`npm run build:assets` 构建生产界面；完整 APK 使用 `scripts/build-apk.ps1` 与本机工具链/签名配置。签名私钥不包含在公开源码中。实际检查见 [VERIFICATION.md](VERIFICATION.md)，设计见 [DESIGN_5.0.md](DESIGN_5.0.md)，与 Harness 的差距见 [HARNESS_PARITY.md](HARNESS_PARITY.md)。

历史快照准备见 [GITHUB_MIGRATION.md](GITHUB_MIGRATION.md)。提供仓库后先恢复并验证发布历史，远端与全新 clone 通过后再清理重复旧源码；本轮没有删除。

## 4.0 更新

这次重做实际生产界面：饱和纯色块、深浅主题、工具轨、顶部标签、连续工具链、手机全屏模型表单和宽屏工作面板。新 Logo 由内置 imagegen 生成，回复时按真实状态变化。Inky 支持拖动回弹，标签与面板有弹性衔接，控件响应触点涟漪。主题与动效页提供明确标注的预览和减少动态效果开关。

安全方向写入所有连接共用的稳定系统前缀；内置安全审计、授权测试和逆向分析技能，使用实际证据与适当范围。原有编程、调试、网页调研继续可用。这是角色和工具工作流升级，不是对底层模型的微调。

包名与签名保留，可以用于覆盖安装；不要先卸载现有版本。离线 APK 包含完整 Debian 环境，因此约 588 MiB。网页、模型和在线搜索需要联网。实体手机上的覆盖安装和新动效流畅度仍需安装后确认。

设计与源码来源见 [DESIGN_4.0.md](DESIGN_4.0.md)，实际验证见 [VERIFICATION.md](VERIFICATION.md)，生成 Logo 和完整提示词见 [branding/logo-generation-400.json](branding/logo-generation-400.json)。

## 3.1.0 更新

修复 ChatGPT 账号请求中 `Value event of type java.lang.String cannot be converted to JSONObject`：转发层增加有限前缀识别，不再只信任响应头；缺失或错误标注的 Content-Type 也能识别 SSE。完整事件到达就向客户端传递，不等待连接关闭。支持 BOM、拆分 CRLF 和非流式 Responses JSON，仍须确认 response.completed 才能执行工具。

界面结构拆为页面骨架、导航、图标、连接和设计系统模块。使用 Lucide 1.61.0 图标及随包许可，延续 assistant-ui MIT 示例的会话结构参考。侧栏按工作区、连接和偏好分组，次要入口折叠；非聊天页也可直接打开侧栏。模型设置在宽屏分为连接列表和编辑区，小屏转为纵向布局，旋转保留输入。统一表单、工具执行链、主题、焦点与短动效。

「外观与显示」新增 30%、40%、50%、60%、70%，现在共九档，默认 90%。小比例会真实缩小内容和普通控件，恢复比例的九个按钮保持可读、可点击。原生网页比例仍单独控制。网页光标从约 28dp 高改为 16dp，采用浅色填充、细深色轮廓和轻点击圈。

MCP 可直接粘贴服务链接、整段桌面客户端配置或 npx/python/node 启动命令，批量校验后原子保存；本机服务首次使用时自动准备环境。手动配置的附加参数与环境变量改为普通分行输入，仍兼容原 JSON。扩展页提供一键启用的排错、审查、网页调研技能；可从文件导入单个 Markdown、技能 ZIP、插件 ZIP 或 MCP JSON，也可填写公开 GitHub 仓库链接下载。自建技能只需名称和工作步骤。第三方导入后点启用；不自动运行宿主 hooks。

## 3.0.0 历史更新

界面改用更紧凑的暖灰、纸白与铜色，收起装饰性区块，保留对话执行链和透明 32 帧小墨。侧栏第一层可直接进入「模型与 API」「账号与模型」「扩展 · MCP 与插件」「外观与显示」。新增页面、弹层和按钮的轻量动效；可选择减少动态效果。

「外观与显示」支持 80%、90%、100%、110% 四档整体比例，默认 90%；网页缩放独立控制。缩放不压缩按钮的物理点击面积。模型配置增加直接切换和编辑按钮，不依赖原生下拉菜单；运行中的任务继续使用开始时选定的连接。

将状态序列化、代码高亮和 MCP 协议处理移到 Worker，合并生成中的界面刷新，跳过不变的回复和附件，非聊天页面不反复渲染聊天。内置 Agent 默认不再以 30 轮为上限；停止、等待用户回答、错误和实际完成仍各自结束当前运行，不自动重复执行状态未知的工具。

新增官方 MCP SDK 的 Streamable HTTP 和本机 stdio 连接、工具目录与调用、资源读取和提示词读取，以及 ZIP 插件导入、启停、移除和 SKILL.md 技能。新增 ChatGPT 账号授权及 Responses 流式连接；账号可用模型以授权后的模型目录为准。

浏览器默认电脑模式，支持保存手机模式偏好。点击和输入使用文档内稳定控件标识，重新定位后验证同一目标，避免仅因无关页面更新陷入观察循环；遮挡、导航、接管和目标改变仍会停止不可靠的操作。包含 2.4.2 手动输入闪退修复：输入法后台线程不再直接读取 WebView 状态。详见 FIX_3.0.0.md。

## 2.4.1 更新

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

1. 安装 `deepseek-android-bridge-v3.1.0.apk`。包名 `io.github.deepseekbridge`，versionCode 21，与本项目旧版使用同一签名，可覆盖升级。要求 ARM64 Android 8.0 / API 26+、Chromium 120+ 的系统 WebView。无需 Root、Termux、电脑或桌面 Harness。
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

- 内置聊天与 Agent：模型请求工具 → 本机真实执行 → SQLite 保存结果 → 回传模型 → 自动下一轮。默认不限制模型轮次；完成、等待补充、停止和失败分开显示。显式传入有限预算的程序调用仍保留预算语义。
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

## ChatGPT 账号连接

侧栏「账号与模型」→ Continue with ChatGPT → 在系统浏览器完成登录与授权 → 返回 App 读取模型 → 选择模型并点「使用此模型」。之后也能从「模型与 API」切换这个连接。

使用官方公开客户端授权流程：回环回调、state/nonce、PKCE、ID Token 签名验证、按账号保存客户端注册和轮换刷新凭据。令牌在原生 Keystore 加密存储中，不进入网页脚本、聊天导出或日志。推理固定使用官方 `/v1/responses`，采用无状态流式请求，并保留加密推理项。账号计划、授权范围、模型可见性和限额由官方服务决定，不把网页会话 Cookie 当成 API 凭据。

尚未使用真实账号完成联调；已验证真实回环 TCP 回调、签名验证、刷新串行化、退出和模拟 Responses 流。当前实现依据 [官方快速开始](https://developers.openai.com/siwc/quickstart)、[登录规范](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)、[模型与推理](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference) 和 [账号与会话](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)。服务未向账号开放时会显示具体失败状态。

## MCP 和插件

侧栏「扩展与技能」→「快速添加」，直接粘贴完整 MCP URL、`mcpServers` / `servers` 配置或一条启动命令，点击「添加并连接」。不需要自己拆开 JSON。HTTP 服务不需要本机 Linux；stdio 首次使用会准备内置 Debian，`/workspace` 指向当前项目。npx 首次下载包需要联网；任意第三方包仍可能有自己的依赖和平台要求。

「手动配置」可填写地址或整条启动命令；附加参数每行一个，环境变量每行 `NAME=value`，编辑时留空保留已有凭据。Context7 预设会填好服务地址，密钥由该服务提供。

保存并启用后点击刷新服务目录，下一次 Agent 运行自动获取其工具。MCP 在独立 Worker 内使用官方 `@modelcontextprotocol/client`；原生层负责 HTTP 流和独立 stdin/stdout/stderr 管道。工具调用必须通过动态 schema 校验并持久记录。网络中断或执行状态未知时明确报错，不自动重放有副作用的调用。模型可通过 `extensions` 工具读取资源、提示词和已启用插件的技能内容；MCP 图片会转为真实项目文件和聊天附件。

「插件与技能」可以一键启用三项本机技能，不需要账号、终端或额外依赖。「从文件导入」自动识别 Markdown、MCP JSON 或 ZIP；没有专用清单的 ZIP 也会递归查找 `SKILL.md`。有清单时兼容 `studio-plugin.json`、`.claude-plugin/plugin.json`、`.codex-plugin/plugin.json` 及 `.mcp.json` 的 `mcpServers`。`${CLAUDE_PLUGIN_ROOT}` 与 `${CODEX_PLUGIN_ROOT}` 可用于程序和参数的插件目录定位。

「从 GitHub 添加」支持公开仓库首页和 Download ZIP 链接，下载到本机后采用同一导入校验。导入后点启用；「自己写技能」只填写名称和步骤即可保存。技能只作为当前用户任务中的工作方法，不覆盖系统约束。兼容范围是配置与技能，宿主专有 hooks 和 UI 组件尚未支持。

最多保存 16 个 MCP 服务和 16 个插件，同时运行最多 4 个 stdio 服务。ZIP 解压上限 32 MiB / 1000 个条目；拒绝越界路径。插件运行在与终端相同的 Debian 环境中，具有该应用可用的文件及网络能力。
