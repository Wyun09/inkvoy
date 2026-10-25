# Claude Code 连接手机桥

在 App 的「工作台 → 连接配置 → 复制 Claude Code 配置」复制完整配置。Claude Code 必须运行在同一部手机的 Debian 终端中，或者通过明确的端口转发访问手机。

```sh
export ANTHROPIC_BASE_URL=http://127.0.0.1:8787
export ANTHROPIC_AUTH_TOKEN='从应用连接页复制的密钥'
export ANTHROPIC_MODEL=deepseek-web
export ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-web
export ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-web
export ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-web
claude
```

根地址不带 `/v1`；密钥不可直接放进共享源码。内置聊天与 Agent 无需这一步。Claude Code 自身按其安装要求配置，不属于本次预装的反编译工具。

外接 Claude Code 的工具由 Claude Code 执行；手机桥只把网页回答适配为 Anthropic Messages、tool_use/tool_result 和 SSE。网页不是原生 Anthropic 模型，不提供签名思考等价保证。官方缓存统计不可见，不能据此承诺缓存命中。
