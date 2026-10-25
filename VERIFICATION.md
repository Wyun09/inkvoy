# v2.4.2 紧急修复验收记录

日期：2026-10-20。完整离线 ARM64 测试版；实体 Android 手机未连接。

## 安装包

- deepseek-android-bridge-v2.4.2.apk，615,847,855 bytes。
- SHA-256：cd23cae9fc8a35ee1060ac9a13d776df7a5103a1bf7f41cbe7952ed0e524cad6。
- io.github.deepseekbridge，versionCode 19，minSdk 26，targetSdk 35。
- 与旧版同签名，可覆盖安装。安装包逐项资产、原生库、DEX、ZIP 路径与 16 KiB 对齐检查通过。
- 最终签名 APK 中的完整 Debian 镜像由 Android AssetManager 回归读取并校验长度和 SHA。

## 本次验证

- JavaScript/协议/DOM/客户端/UI 完整测试：291 项，全部通过。
- Android 框架 API 26/33：131 项，全部通过，无跳过。
- 直接调用生产 PageWebView 输入包装器，覆盖中文组合、提交、删除、Unicode 删除、连续输入和关闭后的迟到通知。
- 撤掉线程保护后，同一中文输入测试按预期失败；恢复生产代码后，完整回归通过。ime-242-negative-control.log 中的 BUILD FAILURE 是预期负向对照。
- 默认执行超过 30 轮无需点击继续，显式预算选项仍可用于测试或其他调用方。
- 当前测试和日志 SHA 见 verification/regression-242.json；APK 证据见 verification/apk-payload.json。

## 验证边界

Robolectric 和桌面渲染不能替代实体手机的输入法、站点登录与后台运行验收。本次未执行真实 DeepSeek 账号登录。

2.4.2 是输入崩溃修复发行版。MCP、OpenAI 账号登录和新一轮 UI 改版不包含在此 APK 中。
