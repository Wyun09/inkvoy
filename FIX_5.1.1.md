# Inkvoy 5.1.1

修复 Android 13 厂商系统在打开无障碍详情页时要求 `OPEN_ACCESSIBILITY_DETAILS_SETTINGS`，触发未捕获 `SecurityException` 的闪退。

- 改为系统公开的 `ACTION_ACCESSIBILITY_SETTINGS` 列表入口，不再直接请求受限详情页。
- 对系统拒绝和页面不存在都作处理；回退到常规系统设置页，回退也不可用时显示手动进入路径。
- 其他权限设置入口复用相同保护，回退失败不会继续抛到主线程。
- App 操控页说明如何在已安装服务/已下载应用中找到 Inkvoy，以及返回后重新检测。
- versionCode 25，沿用已有包名、签名、用户数据与离线镜像。自有代码按用户选择采用 GPL-3.0-only，第三方许可证保留。

新增测试在 Android API 26 和 33 框架中覆盖正常打开、系统拒绝、页面缺失、回退也被拒绝与无页面可打开；手机实机结果仍须覆盖安装后确认。
