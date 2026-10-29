# Inkvoy 5.3.1

这是 5.3.0 之后的 OpenAI Responses 模式热修复版本，版本号为 5.3.1 / versionCode 28。

## OpenAI 模式修复

- 解析 `response.output_item.added` 与 `response.output_item.done`，保留完整的输出项生命周期。
- 聚合 `response.function_call_arguments.delta` 和 `response.function_call_arguments.done`，避免真实流式工具调用丢失参数或变成空回答。
- 支持 Responses 的拒答增量、推理正文增量和推理摘要增量，并在最终消息中保留可展示内容。
- 当完成事件没有携带完整 `output` 时，使用已经确认的输出项作为回退；仍然要求收到 `response.completed` 才提交回答，不会把断流当作成功。
- 新增真实事件顺序的回归用例，覆盖文本、推理、拒答和工具调用。

## 验证

- JavaScript / 界面最终全量：403 项通过，失败、取消、跳过为 0。
- Android API 26/33 框架：244 项通过，失败、错误、跳过为 0。
- 最终签名离线 APK 资源复核：22 项通过。
- 两个 APK 保留原包名 `io.github.deepseekbridge` 和原签名，可以覆盖安装 5.3.0。
- 实体 Android 13 上的真实 OpenAI 账号、网络分流和 GPU 流畅度仍需要安装后确认。

本次修复只改变 OpenAI Responses 解析和版本资源；自定义 Chat Completions、DeepSeek 网页连接和原有工具链保持原协议。
