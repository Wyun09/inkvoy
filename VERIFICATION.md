# 安卓本机桥 v0.2.0 验证记录

| 项目 | 实际结果 | 证据 |
| --- | --- | --- |
| JS / DOM / UI | 97/97 通过，0 失败、0 跳过 | test-results.log |
| 思考开关专项 | 28 项通过 | test/reasoning-control.test.mjs |
| 原生 HTTP | 15 项检查通过，真实本机 TCP | transport-results.log |
| APK 构建、签名 | 通过，API 26+，target 35 | build-apk.log |
| 升级签名 | 与 v0.1.0 一致 | signature-comparison.json |
| 界面截图 | 真实打包资源，模拟连接状态，桌面 Edge 渲染 | preview/README.md |
| 安卓设备 / 真实账号 | 尚未验证 | 未连接设备 |

测试覆盖类名状态缺少 ARIA 的既有故障、显式状态、原生复选框、选项卡、双向切换、不重复点击、点击无效、延迟渲染、隐藏副本、当前输入区域选择、冲突与混合态、自动模式边界。UI 测试包含 320 像素窄屏、页签、44 像素触摸目标、密钥复制委托、未知状态与失败提示、安全文本渲染和网页布局槽切换。

浏览器端测试使用本地 HTML 夹具提供页面，没有接触真实网页账号。原生 HTTP 检查在构建主机 JDK 上运行同一个 LoopbackServer.java，检查真实 TCP 鉴权、Host/Origin、长度限制、SSE 与取消。

最终 APK 大小：131807 字节。SHA-256：`ebd17544d028a5b2a075cf1eafca537b59b5884dda1a46777cf1bf55ebcb1a7c`。

本机不具备 Android 模拟器所需的硬件虚拟化条件，无法提供运行中的安卓系统截图。preview 下的图明确标记为打包 UI 预览。手机端仍需验收网页登录、真实请求、思考内容、图片与后台生命周期。

保留限制：请求体 16 MiB，超限返回 413；图片仅支持 PNG/JPEG/WebP 的 base64 data URL；usage 为估算，缓存命中为 unknown。
