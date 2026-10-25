# 2.4.2 输入闪退紧急修复

## 问题和修复

用户在 Android 13 的内置浏览器手动输入时，Chromium 在 InputConnectionHandlerThread 调用 commitText；应用的输入包装器同步调用 humanActivity → emit → state → WebView.getUrl，违反 WebView 的线程要求并终止应用。

- humanActivity 在输入线程接到通知后，异步投递到主线程再取消当前 AI 步骤、更新光标与页面状态。
- emit 也检查线程，防止其他后台通知直接读取 WebView。
- InputConnection 的原始文字提交、中文组合输入和删除仍委托给 Chromium 自己的输入连接；不等待主线程，不改写文字，不记录输入内容。
- 崩溃报告从已安装包读取真实版本号，修复旧的 2.1.0 硬编码标签。
- 引擎 WebView 使用可附加 Activity 的 Context，修复原生表单弹层缺少 Activity 上下文的问题。
- 内置 Agent 默认不再因 30 轮预算中断；主动停止、明确等待用户和错误保护仍保留。

## 回归方法

BrowserImeRegressionTest 直接调用生产 PageWebView 创建的 InputConnection 包装器，从真实 HandlerThread 执行拼音组合、中文提交、删除、Unicode 删除和连续 100 次输入操作，验证原始输入连接仍在输入线程工作，UI 通知只在主线程执行。另检查浏览器关闭后的迟到通知。

反向对照只在测试期间移除两处线程保护，同一中文输入用例失败；恢复代码后通过。负向测试日志中的 BUILD FAILURE 是预期对照结果。

未连接实体 Android 手机。Robolectric API 26/33、桌面渲染和安装包校验不能替代用户手机上实际输入法的最终验收。

## 安装

使用相同包名和原签名，versionCode 19，可覆盖旧版。无需卸载或清除数据。若启动仍显示旧的已保存崩溃报告，点“重试启动”再进入应用。

这次发行只包含上述紧急修复；MCP、OpenAI 账号登录和新一轮界面改版仍在独立开发中。
