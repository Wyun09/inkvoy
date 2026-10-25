# Inkvoy 5.1.0 验收记录

时间：2026-10-25T11:11:43.442894+08:00。包名 io.github.deepseekbridge，versionCode 24，minSdk 26，targetSdk 35，ARM64 完整离线版。

APK：deepseek-android-bridge-v5.1.0.apk，616,114,511 bytes，SHA-256 `de100ddec8bc9f6a993dab658330419cce6854489c8ef3ac156253239b273c7d`。签名延续旧版；19 项资源和原生负载逐项匹配源码，原生 ELF 满足 16 KiB 对齐。最终包的 Debian 镜像和权限声明已检查。

JavaScript 全量 390/390；Android API 26/33 框架与 Java 管道采集 218 项。失败、取消、跳过均为 0。35 项已安装依赖与锁文件匹配。完整计数、分类和日志哈希见 verification/regression-510.json。

新增覆盖：实际引导入口与 API 编辑器、跳过和进度、示例不自动发送、网络配置保存、两域名独立诊断、原生 HTTP CONNECT 在目标 DNS 不可解析时仍交给代理、本机地址绕过代理；实际 AccessibilityNodeInfo 输入与点击、密码隐藏、过期 ref、允许 App 范围、取消和暂停、截图期间界面改变拒绝、项目截图可重开及不可变聊天像素、App 截图进入下一次模型请求；字号、对比度、44px 点击区域、焦点、手机/横屏与缩放补偿。

早期 UI 超时已定位为测试在设置面板关闭前尝试向 inert 背景输入；测试改为等待实际关闭状态。另一个布局检查等待字体和真实可见的 Native 布局回调后再计数。不把测试输入时序问题写成产品草稿修复。

10 张当前生产资源截图、1 段界面录屏和 FFmpeg 解码帧已查看；界面数据使用明确的 Native/model 测试夹具。保留 5.0 的完整 Logo 呼吸、560ms 状态过渡、即时流式增量和 280ms 思考展开。该录屏不是手机真机录屏。

未连接物理 Android 手机，未验证用户 VPN/DNS、真实 OpenAI/DeepSeek 账号、其他 App 实际操控、覆盖安装或锁屏后台。原生框架测试不等同于手机验收。诊断不能单凭 UnknownHost 判定 DNS 污染，HTTP 401 只说明匿名 HTTPS 可达；账号权限仍以真实授权接口返回为准。显式代理需填写 VPN 实际提供的 HTTP 端口，TLS 校验保持启用。

5.1 没有新增手机帧率或速度提升测量；保留的 5.0 桌面数据只作历史记录。新版不会宣称已经修复手机系统 DNS。

仓库已从 GitHub 公开 API 查到 https://github.com/Wyun09/inkvoy；本轮没有上传源码或创建远端提交，也没有删除旧源码。仅清理可重建的中间 APK，见 verification/build-cleanup-510.json。
