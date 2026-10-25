# v2.4.1 验收记录

日期：2026-10-20。ARM64 完整离线测试版。本机 adb 无已连接设备，未使用真实 DeepSeek 账号或用户日志中的账号。

## 最终 APK

- deepseek-android-bridge-v2.4.1.apk，615,843,759 bytes。
- SHA-256：b84db9e1e9eb86ceb0e38e03ba9dab97673f4d8b4a7e5cb5a862174e3c581c96。
- io.github.deepseekbridge；versionCode 18；minSdk 26；targetSdk 35。
- v2/v3 签名通过，证书与旧版一致，可覆盖升级。
- 9 项 assets、5 个 ARM64 原生库逐项 SHA 与源码一致；DEX、ZIP 路径和 ELF 16 KiB 对齐校验通过。
- Android AssetManager 从最终签名 APK 读取并校验完整 Debian 镜像长度及 SHA。
- 机器记录：verification/apk-payload.json、regression-241.json。

## 自动化结果

- 2.4 功能分支完整 JS/协议/DOM/客户端/UI：290 项，0 失败、0 跳过。
- 最终 2.4.1 生产 UI 额外重跑 3 项浏览器 UI 用例，全部通过；原生导航补丁不改变 JS 行为。
- 最终 APK 的 Android 框架 API 26/33：123 项，0 失败、0 错误、0 跳过。
- 原生分类：权限 5、图片 6、浏览器 30、方向 4、文件快照 20、常驻任务 14、HTTP API 8、响应速度 6、APK 资源 10、硬链接 8、启动与 SQLite 12。
- 四份关键日志的 SHA 及测试类逐项统计记录在 regression-241.json。构建日志保留在本地 build/。

## 本轮新增验证

- 真实桌面浏览器验证 observe → click → type → click → 可见结果；稳定 ref 不因无关倒计时变化而改变。被遮挡控件不暴露为点击目标，输入值与密码不进入观察正文。
- 浏览器缩放后观察采用 visualViewport，控件坐标保持在当前可视范围。Android 框架检查启用手势缩放且不显示原生悬浮缩放按钮。
- 原生鼠标事件带正确来源、主键和位置；目标内容变化、旧 token、视口变化、错误焦点和未提交导航被拒绝。开始加载回调仍保持导航待提交，只有提交可见或匹配当前网址的完成回调才解除等待。输入、全选、清空、删除选区、Unicode 前后删除经原生 InputConnection 回归。
- 人工操作清除当前观察、保留后续 AI 权限；明确接管关闭权限与光标。可操作状态显示光标，截图代码包含透明光标层。
- 方向偏好写入 SharedPreferences，自动/竖屏/横屏映射正确，非法模式不替换已有配置；旋转采用已有 Activity configChanges。
- 生产 UI 验证竖屏上下、横屏左右分屏、草稿与 DOM 实例保留、分隔条键盘调整、缩放按钮、方向设置调用和弹层期间隐藏原生网页层。
- 补测检查发送按钮完整可见，宠物不覆盖聊天标题。竖屏、横屏、设置页截图均已查看。
- API 从侧栏、工作台和外接客户端配置页打开即显示地址、密钥、模型 ID；打开不激活新连接，保存才切换。
- 图片夹具使用真实 PNG 字节，强制走分块传输并比对全部字节；匿名 blob 缩略图、隐藏加载节点和旧聊天图片共存时仍能确认上传，仅触发一次 change 和一次发送。错误像素在 change 与发送前被拒绝。
- 保留原有整页滚动实现，没有依据已撤回的滚动问题重写滚动。

## 验证边界

桌面渲染与模型/Native UI 夹具、Robolectric Android 框架测试均不等于实体 Android 手机验收。新分屏截图用明确 iframe 夹具代替原生 WebView，只用于排版检查。未实测手机上的实际光标合成、站点登录、网站缩放上限、真实 DeepSeek 上传、锁屏和厂商后台策略。

之前常驻任务、流式输出、网页搜索、问答、图片与文件卡片、自定义 API 和终端功能均随完整回归保留。网页结构变化仍可能要求更新适配器，失败时明确报错，不盲目重复发送或执行工具。

## 构建空间

两次仅清理明确 build 目录中的中间 APK，共释放 8,004,872,153 bytes；最终安装包、回退发行版、源码、离线环境和工具链保留。见 verification/artifact-cleanup-240.json 与 artifact-cleanup-241.json。