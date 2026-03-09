# Cloudflare Worker 自动部署说明

> English: [deployment-worker-auto.md](deployment-worker-auto.md)

本文档只聚焦 Worker 侧：Wrangler、Cloudflare 运行时配置、Webhook 回填内容，以及线上排障。

## 作用范围
项目以 Cloudflare Worker 形式部署，核心文件与命令如下：
- 配置文件：[wrangler.toml](../wrangler.toml)
- 入口文件：[src/index.ts](../src/index.ts)
- 本地开发：`npm run dev`
- 打包校验：`npm run build`
- 正式部署：`npm run deploy`
- 自动发布 workflow：[`.github/workflows/cloudflare-worker-deploy.yml`](../.github/workflows/cloudflare-worker-deploy.yml)

## 前置准备
部署前需要准备：

| 项目 | 必填 | 说明 |
| --- | --- | --- |
| Cloudflare 账号 | 是 | 用于托管 Worker |
| Wrangler 登录态或 API Token | 是 | 手动部署和自动部署都需要 |
| `BOT_TOKEN` | 是 | Telegram Bot Token |
| `HOOK_CONFIG_JSON` | 是 | 仓库 / 组织 路由映射 |
| GitHub Webhook Secret | 是 | 必须与命中的路由 secret 一致 |

## 确认 `wrangler.toml`
至少确认 [wrangler.toml](../wrangler.toml) 中的以下字段：

```toml
name = "github-webhook-to-telegram"
main = "src/index.ts"
compatibility_date = "2026-03-08"
```

发布前确认：
- `name` 符合你的 Worker 命名规则
- `main` 仍然指向当前入口
- `compatibility_date` 是有意固定的

## 运行时变量格式
Worker 只读取：
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

### 本地 `.dev.vars`
```dotenv
BOT_TOKEN=123456:replace-with-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

### Cloudflare Secret 内容
`BOT_TOKEN`
```text
123456:replace-with-real-bot-token
```

`HOOK_CONFIG_JSON`
```json
{"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"},"your-org":{"chat_id":"@your_channel","secret":"replace-with-another-secret"}}}
```

`HOOK_CONFIG_JSON` 必须以单行 JSON 形式保存，不能带注释，也不要包 Markdown 标记。

## GitHub Actions Secret 同步
自动发布 workflow 会在代码部署成功后，把以下值同步到 Worker：
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

这意味着 GitHub Actions Secrets 必须与生产 Worker 配置保持一致。

## 推荐的 `HOOK_CONFIG_JSON`
可读版：
```json
{
  "gh_webhooks": {
    "your-org/your-repo": {
      "chat_id": -1001234567890,
      "secret": "replace-with-random-secret"
    },
    "your-org": {
      "chat_id": "@your_channel",
      "secret": "replace-with-another-secret"
    }
  }
}
```

匹配规则：
- 键可以是仓库全名，如 `your-org/your-repo`
- 键可以是组织名，如 `your-org`
- 当前实现会优先匹配组织级，再匹配仓库级

## GitHub Webhook 页面填写
部署完成后，在 `Settings -> Webhooks -> Add webhook` 中填写：

```text
Payload URL: https://<your-worker>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: replace-with-random-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

## 推荐上线顺序
1. 本地执行 `npm run build`
2. 本地手动执行一次 `npm run deploy`
3. 填好 GitHub Webhook 并验证端到端通知
4. 手动流程稳定后，再用 deploy workflow 做可重复的生产发布

## 排障建议
### GitHub 返回 `403`
优先检查：
- Webhook `Secret` 是否与命中的路由一致
- `HOOK_CONFIG_JSON` 是否包含对应仓库或组织
- `Content-Type` 是否为 `application/json`

### GitHub 成功但 Telegram 没消息
优先检查：
- 机器人是否已加入目标聊天
- 机器人是否有发送权限
- `BOT_TOKEN` 是否正确
- 当前事件是否受支持

### Worker 报配置错误
优先检查：
- `HOOK_CONFIG_JSON` 是否为合法 JSON
- 是否包含 `gh_webhooks`
- `chat_id` 是否是合法字符串或数字
- `secret` 是否为空字符串
