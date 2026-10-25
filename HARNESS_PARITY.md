# DeepSeek Harness 对照范围

参考仓库：https://github.com/deepseek-ai/deepseek-harness 。本地已取得的参考提交：`687f282e8625c6b8d11ff58211a90524be2e4317`，tree：`f127f0f96a815eac4dea336a2ae0d9cd0f2aa82d`。该快照使用 MIT 许可证，Copyright 2026 DeepSeek。此记录针对该本地快照，不表示实时检查了上游最新版本。

本应用保留独立的 Android Java / WebView / JavaScript 运行架构。当前采用对应的交互与会话组织思路，没有完整移植 Harness，也不能以“开源可用”替代兼容性验证。

| 能力 | Inkvoy 5.0 状态 | 具体边界 |
| --- | --- | --- |
| 流式正文与推理显示 | 已实现 | 网页通道先校验协议；API 使用 SSE；不将未验证工具包当作已执行结果 |
| 工具执行链 | 已实现 | 说明、操作、结果按实际先后排列，最终答案独立 |
| 实时命令日志 | 已实现 | stdout/stderr、退出码、停止、超时、截断；预览与最终结果分开 |
| 问答卡片 | 已实现 | 选择是草稿，显式提交后继续任务 |
| `/` 命令 | 已实现 | 23 项内置命令；不是 Harness 全部命令的自动兼容层 |
| `@` 引用 | 已实现 | 项目文件、启用技能、会话摘录及当前浏览器信息 |
| 上下文显示与压缩 | 已实现 | 容量来源、模型绑定、完整原始记录、滚动摘要、恢复 |
| 会话分支 | 已实现 | 从当前记录复制上下文，共用原项目；不是文件系统分支 |
| 模型推理档位 | 已实现 | 从目录元数据或手动声明读取，未知保持默认 |
| MCP | 已有，部分环境未实机验收 | HTTP / stdio、tools/resources/prompts；手机进程依赖已初始化 Debian |
| 插件和技能 | 部分实现 | 支持 MCP 配置与 SKILL.md、导入、启停；第三方默认不启用 |
| 浏览器控制与页面脚本 | 已实现 | 应用内 WebView 与分屏；不是 Harness 桌面浏览器宿主 |
| Cordis 服务生命周期与 hook 系统 | 未移植 | 尚无完整宿主服务图、热加载、插件 hook 兼容性 |
| LSP | 未移植 | 不能宣称已有完整编辑器语言服务 |
| 沙箱/隔离 | 未移植 | PRoot 共享 Android 内核，不是安全沙箱 |
| ACP / headless SDK | 未移植 | 保留现有 HTTP 协议；不等于完整 Harness SDK |
| 目标与计划模式 | 已实现 | 人工目标/验收、结构化步骤、只读规划、明确批准后执行 |
| 子代理与 Agent Team | 部分实现 | 真实独立模型调用、只读工具、并行任务板、报告汇总与取消；主代理统一写入，不提供子代理互相发消息和独立写分支 |
| 多模型端点集群 | 已实现初版 | 手机统一调度所选 API / 网页连接、按负载分配、同连接串行；不提供跨设备运行节点 |

已阅读的参考涉及 docs/architecture.md、agent loop/tool call handling、session repair、chat projection/turn rail 与 ui-user-questions。更早参考记录见 verification/harness-source-review.md。本次细项以源码和 verification/regression-500.json 为准。

推理档位另核对了同一提交的 llm-deepseek-account/src/catalog.ts、resolve-catalog.ts，以及 llm-pi-ai/src/catalog.ts、models.ts：Harness 的账号目录使用带凭据的远程 `/models` 请求与缓存；通用适配器也会使用其已安装模型目录提供的能力，不能笼统声称所有服务都能由标准 `/models` 返回推理档位。Inkvoy 自动读取当前连接实际公布的元数据，兼容 `models` 和 `data` 目录封装，不将模型 ID 或可见性当作推理能力。

后续移植按“接口契约 → Android 生命周期 → 真实控件验证 → 许可证记录”逐项推进，不一次性宣称与上游功能完全一致。
