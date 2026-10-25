# Inkvoy 4.0.0 验收记录

验收日期：2026-10-23。包名 io.github.deepseekbridge；versionCode 22；minSdk 26；targetSdk 35；ARM64 完整离线测试版。

## 最终产物

APK：deepseek-android-bridge-v4.0.0.apk，616,048,828 bytes。SHA-256：`1038a4a3d5a63e0bb2df9f5f76c536aeddb145da8deb7689770e30b6aea7a28d`。

签名证书与旧版相同；v2/v3 签名、原始 ZIP 路径、DEX、原生 ELF 对齐和 18 项源码负载逐项匹配。Android AssetManager 从最终 APK 校验完整 Debian 镜像。设备上的覆盖安装尚未验收。

## 自动回归

- JavaScript、协议、浏览器、媒体、客户端及界面：328 / 328 通过，失败、取消、跳过均为 0。
- Android API 26/33 框架：181 通过，失败、错误、跳过均为 0。
- 35 项已安装依赖版本与锁文件逐项匹配。
- API 保存与切换、流式正文、图片与文件附件、工具链、问答、终端、浏览器分屏和缩放、横竖屏、九档显示比例、返回焦点、存储不可用启动均有实际控件验证。
- 新增实际指针拖动 Inky、弹性回位、减少动态效果、真实工具状态驱动回复 Logo、稳定安全角色前缀、Native 安全技能安装和字体资源检查。
- 深色总览按钮对比度修正后另跑 3 项界面检查，全部通过，包括深浅色按钮文字对比度至少 4.5:1。协议引擎、两个 Worker 与 DEX 字节和完整回归时相同；最终 APK 重新执行全部 181 项 Native 检查。

逐类统计、日志及哈希：`verification/regression-400.json`。

## 视觉与动态

23 张生产资源截图，覆盖 390×844、844×390、1440×960。深浅主题、工作状态、文件编辑、终端、工具、账号、MCP、技能、模型表单和设置均已渲染检查。两个 WebM 是实际页面操作录屏，包含拖动回弹、标签切换、品牌状态预览和等待终端结果时的真实状态动画。

截图和录屏由桌面 Edge 加明确的 Native/model 测试夹具产生。浏览器槽位是原生表面的占位展示，不是手机网页截图。设置中的动效预览明确标注，不会发起模型调用。见 `verification/ui-previews-400.json`、`verification/ui-motion-400.json`。

## 性能测量

Desktop Edge, 390 x 844 CSS pixels, 4x CPU throttle. Synthetic 60-turn history. This is not a physical Android frame-rate measurement.

当前版本重复渲染中位数 1.20 ms、P95 1.80 ms；重复原生布局次数 [0, 0]。完整对照在 `verification/ui-performance-400.json`。这是桌面模拟负载，不能推导手机帧率或点击延迟。弹簧共用一个 RAF，静止后停止；Native 浏览器槽位不会参与缩放位移动效。

## 尚未验证

没有连接实体 Android 手机，没有使用真实 DeepSeek/OpenAI 账号，没有进行手机锁屏后台、真实 MCP 本机进程或新包覆盖安装验收。保留这些限制，不把测试夹具当作真实账号调用结果。
