# 使用教程

> English: [usage.md](usage.md)

这份教程解释运行时配置本身：Telegram、`HOOK_CONFIG_JSON`、GitHub Webhook 如何对应。部署步骤见 [deployment.zh-CN.md](deployment.zh-CN.md)。

## 1. Telegram Bot
1. 在 Telegram 打开 [BotFather](https://t.me/BotFather)。
2. 发送 `/newbot` 创建机器人。
3. 记录 Token，作为 `BOT_TOKEN`。
4. 把机器人加入目标私聊、群组或频道。
5. 确认机器人能发送消息。

`chat_id` 可以是：
- 数字 ID，例如 `-1001234567890`。
- 公开频道用户名，例如 `@channel_name`。

## 2. `HOOK_CONFIG_JSON`
最小配置：

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

多路由配置：

```json
{
  "gh_webhooks": {
    "your-name/your-repo": {
      "chat_id": -1001234567890,
      "secret": "repo-secret"
    },
    "your-org": {
      "chat_id": "@your_channel",
      "secret": "org-secret"
    }
  }
}
```

保存到 GitHub Secrets 时必须压成一行：

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"repo-secret"},"your-org":{"chat_id":"@your_channel","secret":"org-secret"}}}
```

匹配顺序：
1. 先匹配 `organization.login`。
2. 再匹配 `repository.full_name`。

所以组织级配置会覆盖仓库级配置。

## 3. Webhook Secret
`secret` 不是 Telegram token。它用于校验 GitHub Webhook 签名。

GitHub 发送请求时会用 Webhook 页面填写的 `Secret` 对请求体计算 HMAC-SHA256，并放到 `X-Hub-Signature-256` 请求头。Worker 会用 `HOOK_CONFIG_JSON` 中命中的 `secret` 重新计算并比较。

如果两边不一致，Worker 返回 `403`。

## 4. GitHub Webhook
在目标仓库或组织中打开：

`Settings -> Webhooks -> Add webhook`

填写：

```text
Payload URL: https://<worker-name>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: repo-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

建议第一次选择 `Send me everything`，确认链路正常后再按需要缩小事件范围。

## 5. 支持事件
当前会生成 Telegram 消息的事件：
- `create`
- `delete`
- `discussion`
- `fork`
- `issues`
- `ping`
- `public`
- `pull_request`
- `push`
- `star`

不支持的事件不会报错，只会返回没有可发送内容。

## 6. 本地验证
本地验证不是 fork 自动部署必需项。

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

本地运行：

```bash
cp .dev.vars.example .dev.vars
pnpm dev
```

`.dev.vars` 示例：

```dotenv
BOT_TOKEN=123456:your-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"repo-secret"}}}
```

不要提交 `.dev.vars`。

## 7. 验证通知
1. 在 GitHub Webhook 页面打开最新 delivery。
2. 确认 HTTP 状态成功。
3. 打开 Telegram，确认收到消息。

常见问题：
- `403`：Secret 不一致、仓库未命中配置、Content type 不是 JSON。
- GitHub 成功但 Telegram 无消息：机器人没权限、`BOT_TOKEN` 错误、事件不受支持。
- 改了 GitHub Secrets 但线上没变：手动运行 deploy workflow，或推送新 tag 重新部署。
