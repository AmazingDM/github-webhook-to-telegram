# 架构说明

## 目标
本项目运行在 Cloudflare Workers 上，用于接收 GitHub Webhook，并把关键信息转发到 Telegram 聊天。

## 请求流程
1. GitHub 向 Worker 的 `POST /` 发送 Webhook 请求。
2. Worker 校验 `User-Agent`、`Content-Type`、`X-Hub-Signature-256`。
3. Worker 从 `HOOK_CONFIG_JSON` 中匹配仓库或组织对应的目标配置。
4. Worker 将支持的 GitHub 事件格式化为 Telegram HTML 消息。
5. Worker 调用 Telegram Bot API 的 `sendMessage` 接口发送消息。
6. Worker 返回简单文本结果，便于 GitHub Webhook 页面对接调试。

## 模块划分
- `src/index.ts`：HTTP 入口与响应编排。
- `src/config.ts`：环境变量解析、配置结构校验、仓库/组织映射匹配。
- `src/github.ts`：GitHub 请求识别与 HMAC SHA-256 签名校验。
- `src/formatters.ts`：事件消息格式化与 HTML 转义。
- `src/telegram.ts`：Telegram Bot API 调用。

## 配置模型
- `BOT_TOKEN`：Telegram Bot Token。
- `HOOK_CONFIG_JSON`：单个 JSON 字符串，包含 `gh_webhooks` 映射。
- `gh_webhooks` 的键既可以是仓库全名，也可以是组织名。

## 设计取舍
- 继续使用单个 JSON 配置，目的是贴近旧版 `config.json`，便于迁移。
- 继续使用 Telegram `parse_mode=HTML`，以最大程度保留旧消息格式。
- 不引入 KV、D1 或管理后台，保持项目职责单一。
