# Claude Code 直接连接安卓桥

APK v0.4.0 内置 Anthropic Messages 适配与任务会话复用，无需额外模型或第二个协议代理。

## 同一部手机调用

先在桥内登录 DeepSeek 并运行接口自测。进入「连接 → 复制 Claude Code 配置」，把内容合并到 Claude Code 的 `~/.claude/settings.json` 的 `env` 字段，保留已有设置。配置含手机密钥，勿公开分享。

以下是占位示例，实际密钥从手机应用复制：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:8787",
    "ANTHROPIC_AUTH_TOKEN": "替换为手机应用内复制的密钥",
    "ANTHROPIC_MODEL": "deepseek-web",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-web",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-web",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-web",
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1"
  }
}
```

Base URL 使用根地址，不加 `/v1`；客户端会请求 `/v1/messages`。三档默认模型均映射为网页模型。手机必须先具备能运行 Claude Code 的环境；桥本身无需 Termux。首次用普通文本与一个小文件写入任务验证，分屏保持桥可见。

## 电脑 Claude Code 连接手机

`127.0.0.1` 指本机，电脑不能直接通过自己的 8787 访问手机。若使用 USB/ADB，可先在已授权调试的手机上运行桥，再在电脑执行：

```powershell
adb forward tcp:18787 tcp:8787
```

然后将上述配置中的 `ANTHROPIC_BASE_URL` 改为 `http://127.0.0.1:18787`。该方式需要电脑连接手机；手机客户端调用本机桥不需要这一步。本桥没有开放局域网监听。

## 已验证的协议流程

使用本机已安装的 Claude Code 2.1.285，隔离配置与工作目录，连接生产 JS 引擎与确定性模型夹具，已验证：

1. Claude Code 发出流式 `/v1/messages`，携带真实 Write 工具 Schema（draft-2020-12）。
2. 桥返回 `tool_use` 及参数，Claude Code 实际写入 `bridge-client-smoke.txt`。
3. 第二次请求传回真实 `tool_result`；模型夹具读取结果并返回 `end_turn`。
4. 进程退出码为 0，文件内容与预期相同。
5. 两次调用使用一个模型夹具会话，第二轮只提交新增工具结果；工具 Schema 未变时不重复发送。

证据见 `claude-smoke-results.json`。这验证客户端协议与实际工具执行，不代表安卓真机、真实 DeepSeek 账号或所有 Claude Code 功能已验收。

## 搜索、思考与缓存

桥默认启用网页智能搜索，发送前确认真实按钮状态，不需要外部搜索服务。可在概览调整默认策略，原始 API 请求可用 `web_search` 覆盖。Anthropic 服务工具 `web_search_*` 也会启用网页搜索，但不提供其原生结果块、引用格式和域名/位置过滤语义。

thinking enabled/adaptive 映射为网页深度思考。网页没有 Anthropic 的真实思考签名，不保证依赖签名透传的功能。结构化输出和服务端代码执行未实现，明确报错。客户端的自定义工具由客户端执行。

同一 Claude Code 任务按返回的完整历史自动续接；无需额外设置会话 ID。切换任务会分别保留关联。历史压缩/改写、应用进程退出或网页会话失效可能需要新建；概览中可以主动重置。详见 FIX_0.4.0.md。

token 按逻辑 API 历史估算，缓存统计为 unknown。不能作为网页累计上下文、DeepSeek 官方账单或缓存命中证明。

对照文档：[Claude Code 网关协议](https://code.claude.com/docs/en/llm-gateway-protocol)、[网关配置](https://code.claude.com/docs/en/llm-gateway-connect)、[Anthropic 流式协议](https://platform.claude.com/docs/en/build-with-claude/streaming)。
