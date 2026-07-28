# Provider Adapter

## 目标

让不懂 API 的用户只需要在设置页选择服务商、粘贴密钥并点击保存。应用内部统一走 OpenAI-compatible Chat Completions 请求，不需要外接服务器。

## DeepSeek

官方文档显示 DeepSeek 支持 OpenAI 兼容格式：

- Base URL: `https://api.deepseek.com`
- Chat endpoint: `/chat/completions`
- 默认模型：`deepseek-v4-flash`
- 可切换模型：`deepseek-v4-pro`

实现策略：

- MVP 默认 `deepseek-v4-flash`。
- 设置页允许高级用户修改模型名。
- 错误处理重点覆盖 401、404、429、5xx。

## 豆包 / 火山方舟

火山方舟 V3 接口兼容 OpenAI 协议，但模型调用通常绑定控制台 Endpoint ID。

实现策略：

- Base URL 默认 `https://ark.cn-beijing.volces.com/api/v3`。
- 设置页将模型字段标记为“模型 / Endpoint ID”。
- 不内置某个固定豆包模型编号，避免用户所在账号、区域或服务开通状态不一致。

## 安全存储

前端只负责采集输入，不持久化密钥。Rust Core 使用 `keyring` 调用系统凭据能力：

- Windows: Windows Credential Manager
- macOS/Linux: 后续如需跨平台可复用同一接口

“保存并测试”流程：

1. 校验 provider、base_url、model、api_key。
2. 暂存 API Key 到系统凭据。
3. 发送极短探测请求。
4. 成功则保留；失败则删除刚保存的密钥。

## 下一步

- 增加流式输出，让桌宠边想边说。
- 增加系统提示词编辑，用于固定性格和边界。
- 增加本地对话历史，默认关闭云同步。
- 可选增加 Ollama/llama.cpp 离线模式。
