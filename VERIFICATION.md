# Inkvoy 5.0.0 验收记录

验收时间：2026-10-24。包名 io.github.deepseekbridge；versionCode 23；minSdk 26；targetSdk 35；ARM64 完整离线测试版。

## 最终产物

APK：deepseek-android-bridge-v5.0.0.apk，616,089,858 bytes。SHA-256：`a5fbccb1b5530283c3d091d7266aec5a627a50e15d7853da031ee32b9a19ec36`。

签名与旧版相同。v2/v3、ZIP 路径、DEX、原生 ELF 对齐和 19 项源码负载匹配。AssetManager 从最终签名 APK 校验完整 Debian 镜像；尚未在用户手机验收覆盖安装。

## 自动检查

- JavaScript：381 / 381 通过；失败、取消、跳过均为 0。
- 全量回归后仅调整 Logo 的 CSS 摆动幅度；随后 22 项动效、流式、回复与目录针对检查通过。前后 APK 的代码与原生负载相同，仅 assets/app.css 不同，见 verification/post-style-delta-500.json。
- Android API 26/33 框架与 Java 管道采集：196 通过；失败、错误、跳过均为 0。其中管道检查 3 项；另以真实本机 HTTP 套接字验证 3 个端点和目录读取可以同时收到请求。
- 35 项已安装依赖与锁文件逐项匹配；其他平台的可选二进制未装入本机是预期结果。
- 真实控件覆盖自动模型目录、1M 容量展示、精确推理档位请求、模型默认参数省略、命令与引用、文件摘录进入模型输入、收起与恢复草稿、页面脚本路由、账号 DNS 重试和最新命令输出。
- 日志验证覆盖 stdout/stderr 的进行中显示、重复/错项目事件拒绝、手动折叠保留、最终失败退出码、复制、预览不持久化及 UTF-8 跨块。
- 新增目标/计划/协作验证：计划执行权限、人工批准、验收证据、跨端点并发与同连接排队、子代理读写边界、全体停止、失败保留、容量预算、窄屏与横屏控件。
- 启动、全屏、IME 主线程、文件/媒体、MCP、HTTP 协议与持久化等回归保留。

完整分类与可校验日志：verification/regression-500.json。测试使用生产界面资源以及明确的 Native/model 夹具，Java 框架测试不等同于物理手机执行。

## 视觉与动效

29 张生产页面截图，覆盖 390×844、844×390 与 1440×960。WebM 是实际页面操作录屏；使用 FFmpeg 解码多个时点，确认 Logo 形态、Inky 姿态和命令日志变化，并查看解码帧。页面没有 JavaScript 异常。

截图中的浏览器区域是 Native 表面占位，并非手机网页截屏。命令与账号数据为明确的测试夹具。记录见 verification/ui-previews-500.json 与 verification/ui-motion-500.json。

## 性能

Desktop Edge, 390 x 844 CSS pixels, 4x CPU throttle. Synthetic 60-turn history. This is not a physical Android frame-rate measurement.

60 轮历史、4 倍 CPU 降速、每版 50 样本；采样时没有并发回归套件。4.0 中位 3.00 ms、P95 4.50 ms；5.0 中位 4.20 ms、P95 7.90 ms。不将单次桌面基准视为手机速度提升证据。两版重复 Native 布局调用均为 0；新 UI 挂载最近 20 轮，历史日志按需展开。

该数据不能换算为 Android 13 帧率或用户手机的点击延迟。日志事件有频率和长度上限，预览不触发整份会话持久化；动画后台暂停。手机流畅度仍需实测。

## 明确边界

没有连接物理 Android 手机，没有真实 DeepSeek/OpenAI 账号调用、锁屏后台、真实 Android MCP 进程或覆盖安装验收。网络分类与重试界面已修复，无法替手机修复系统 DNS / VPN 分流。模型目录没有公开元数据时不猜测容量或推理档位。模型容量与本地记录保存上限分开，详见 DESIGN_5.0.md。

Harness 功能仍有差距，见 HARNESS_PARITY.md。GitHub 目标地址尚未提供；本轮只清点历史，没有推送或删除旧源码。
