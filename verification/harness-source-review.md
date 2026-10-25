# DeepSeek Harness 源码对照

审阅日期：2026-10-19 至 2026-10-20。

- 官方仓库：https://github.com/deepseek-ai/deepseek-harness
- 固定提交：`687f282e8625c6b8d11ff58211a90524be2e4317`。
- 上游许可：MIT，Copyright (c) 2026 DeepSeek。实际移植代码时须随分发保留版权和许可；第三方依赖分别核对。
- 本轮范围：下载并审阅 16 个指定文档/源码文件，记录 SHA-256；没有运行上游代码、安装依赖、改动已安装桌面 Harness 或复制上游源码到 APK。参考清单见同目录 JSON。

## 对照结果

| 具体模块 | 上游实现 | 手机端 2.2.0 与后续方向 |
| --- | --- | --- |
| `core/agent-loop` | 一次模型调用与其工具构成 step；存在工具结果等待后续请求时继续 turn；执行前后留下会话事实 | `js/client.js` 已有模型→工具→模型循环，工具执行前等待保存确认；当前最多 30 轮，可由用户继续追加。后续可用显式 turn/step 事件替换部分可变快照 |
| `core/agent-loop/src/assistant-stream.ts` | 每次生成有 attemptId、顺序 chunk、唯一结束帧；最终提交与临时展示分开 | 当前以 requestId 隔离草稿，最后用已验证结果提交，未完成工具不执行；尚未移植上游的完整 attempt 事件重放 |
| `api/session-controller/.../assistant-stream.ts` | 检查流帧顺序，关联 durable settlement；缺帧时重新建立基线 | 当前 Android WebView 为同进程回调，原生 API 为 SSE；仍缺上游远端重连用的序号基线协议，后续增加远端连接时应一并实现 |
| `client/ui-chat/.../TurnProcessNodeView.tsx`、`turn-rail-items.ts`、`event-projection.ts` | 从会话事件派生展示节点，过程展开与轮次导航独立；已加载窗口和全量轮次大纲合并 | 当前说明和各自工具按发生顺序穿插，最后回答位于链尾；首屏只挂载最近 20 轮。全量大纲跳转、事件派生视图仍可继续学习 |
| `client/ui-chat/.../use-scroll-follow.ts` | 把用户的跟随意愿与原生滚动动画分开，支持锚点补偿和减少动态效果 | 当前保留阅读位置并提供“回到最新”；复杂键盘伸缩和持续原生滚动下的意愿状态机可继续移植、配合实体手机验证 |
| `core/session/src/repair.ts`、`core/agent-loop/src/tool-calls.ts` | 恢复时区分未开始和结果未知的调用；保留既有结果，为并行安全工具提供有界调度和独占屏障 | 当前原生工具日志阻止同 ID 操作重复执行，工具顺序运行；不把推测结果伪造成成功。并行工具调度需要先标注工具副作用，作为独立后续改动 |
| `llm/llm/src/assistant-stream.ts`、`llm/llm-deepseek/src/sse.ts` | 模型适配器与组装器分层，SSE 解码和模型语义分别负责 | 当前新增的连接控制器、SSE 组装器与原生 HTTP 已分开；支持 OpenAI 兼容 Chat Completions，未声称支持所有上游适配器 |

上游基于 Cordis 将模型、工具、会话和循环组合成插件。手机端保留其 Android 原生 HTTP、WebView 网页连接、PTY 和离线 Debian 所需的边界；后续复用优先从有清晰输入输出的事件投影、滚动控制、工具恢复入手，并各自验证依赖和许可。

## 可复查的来源

- 架构及 turn flow：https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/architecture.md
- Agent loop：https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/README.md
- 许可：https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/LICENSE

当前 APK 的 263 项 JS/UI 和 69 项 Android 框架结果仅覆盖本项目的实现；没有运行上游测试，也没有把上述差距标成已经完成。

## 2.3.0 问答参考

另审阅 ui-user-questions README、question-reply.ts 和 ask-question-card-model.ts，参考待选草稿与明确提交的区分、受限高度的问答区、跳过与答案记录。手机端为独立实现，未复制上游源码；实际哈希见 JSON。上文 2.2.0 数量为历史结果，当前验收见 VERIFICATION.md。
