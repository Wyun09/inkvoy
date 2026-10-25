# Inkvoy

**Android 手机上的 AI 工作台。对话之后，继续完成工作。**

An Android AI workspace for coding, security research and reverse engineering.

[English](README.en.md) · [构建](docs/BUILD.md) · [版本历史](docs/HISTORY.md) · [验证记录](VERIFICATION.md) · [GPL-3.0](LICENSE)

![Inkvoy 工作台](docs/assets/inkvoy-cover.jpg)

界面展示使用示例任务数据。

## 能做什么

- **连续的工作过程**：流式回复、思考过程、工具执行链、标准输出、错误输出、退出状态与可展开的结果。
- **手机上的终端与文件**：Debian ARM64、PTY、项目文件、常驻开发进程，以及随离线环境提供的逆向分析工具。
- **可观察的浏览器**：页面观察、点击、输入、清空、滚动、缩放与脚本，支持人机共同操作和分屏查看。
- **自己的模型与工具**：DeepSeek 网页桥、自定义 OpenAI 兼容端点、ChatGPT 账号连接、MCP、插件与技能。
- **较长的任务**：`/` 命令、`@` 引用、上下文面板、压缩、计划、目标、子代理与多端点协作。
- **App 操控与辅助设置**：系统无障碍服务、用户选择的 App 范围、单次允许与暂停；阅读字号、对比度、TalkBack 和减少动态效果。

具体接口可用性受实际模型、网页状态、账号权限与手机系统影响。实体设备和真实账号验证范围见 [VERIFICATION.md](VERIFICATION.md)。

## 当前版本：5.1.1

修复 Android 13 厂商系统在打开无障碍详情页时抛出权限异常的闪退：使用公开的无障碍列表入口，处理系统拒绝、页面不存在和回退失败。覆盖安装保留包名与签名。详见 [修复说明](FIX_5.1.1.md)。

## 开发

```sh
npm ci
npm run build:assets
npm test
```

Android APK 构建还需要 Android SDK、JDK、自行管理的签名和离线运行镜像。具体步骤见 [docs/BUILD.md](docs/BUILD.md)。普通 Git 历史包含应用源码、测试、锁文件、原生库及许可记录；大型离线镜像、APK 和完整发布源码归档另列于 [EXTERNAL_ARTIFACTS.json](EXTERNAL_ARTIFACTS.json)，尚未作为 GitHub Release 附件上传。

## 版本与源码来源

从实际保存的发布快照恢复了 **18 个版本**，覆盖 0.1.0 至 5.1.1；每个版本有独立恢复提交及 `release/版本号` 分支。恢复提交使用实际导入日期，并保留原始来源、文件校验与排除清单。缺少源码的版本有明确记录。见 [完整历史](docs/HISTORY.md)。

## 许可证

项目自有代码采用 **GPL-3.0-only**。第三方组件、字体、运行时和素材保留其原许可证与署名，见 [LICENSING.md](LICENSING.md)、[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 `third_party/`。
