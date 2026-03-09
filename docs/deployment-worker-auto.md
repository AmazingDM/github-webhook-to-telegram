# Cloudflare Worker 自动部署说明

本文档只负责 Worker 侧内容：Wrangler、Cloudflare 运行时配置、Webhook 回填信息，以及上线后的排障重点。

## 1. 目标

项目运行在 Cloudflare Workers 上，入口文件和部署命令如下：

- Worker 配置文件：[wrangler.toml](../wrangler.toml)
- 源码入口：[src/index.ts](../src/index.ts)
- 本地开发：`npm run dev`
- 打包检查：`npm run build`
- 正式部署：`npm run deploy`

## 2. 部署前准备

部署前需要准备以下内容：

| 项目 | 必填 | 说明 |
| --- | --- | --- |
| Cloudflare 账号 | 是 | 用于托管 Worker |
| Wrangler 登录态或 API Token | 是 | 本地手动部署或 Actions 自动发布都需要 |
| `BOT_TOKEN` | 是 | Telegram 机器人 Token |
| `HOOK_CONFIG_JSON` | 是 | 仓库 / 组织 与 Telegram 目标映射 |
| GitHub Webhook Secret | 是 | 与映射中的 `secret` 一一对应 |

## 3. `wrangler.toml` 需要确认的内容

当前仓库中的 [wrangler.toml](../wrangler.toml) 至少有两个关键字段：

```toml
name = "github-webhook-to-telegram"
main = "src/index.ts"
compatibility_date = "2026-03-08"
```

上线前请确认：

- `name` 是否符合你的 Worker 命名
- `main` 是否仍然指向当前入口
- `compatibility_date` 是否需要跟随你实际发布时间更新

## 4. Worker 运行时变量格式

当前代码只读取两个变量：

- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

### 4.1 本地 `.dev.vars` 模板

```dotenv
BOT_TOKEN=123456:replace-with-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

### 4.2 Cloudflare Secret 内容格式

`BOT_TOKEN`：

```text
123456:replace-with-real-bot-token
```

`HOOK_CONFIG_JSON`：

```json
{"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"},"your-org":{"chat_id":"@your_channel","secret":"replace-with-another-secret"}}}
```

注意：

- Cloudflare 环境变量界面里建议直接填“单行 JSON”
- 不要带 Markdown 标记
- 不要带注释
- 不要复制格式化后的多行 JSON 直接进去

## 5. `HOOK_CONFIG_JSON` 推荐模板

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

可直接填写到 Secret 的单行版：

```json
{"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"},"your-org":{"chat_id":"@your_channel","secret":"replace-with-another-secret"}}}
```

匹配规则说明：

- 键可以是仓库全名，例如 `your-org/your-repo`
- 键也可以是组织名，例如 `your-org`
- 当前代码会优先按组织名匹配，再按仓库全名匹配

## 6. GitHub Webhook 页面填写格式

部署成功后，把 Worker 地址填回 GitHub：

`Settings -> Webhooks -> Add webhook`

建议填写为：

```text
Payload URL: https://<your-worker>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: replace-with-random-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

其中：

- `Payload URL` 是部署成功后 Wrangler 返回的 Worker 地址
- `Secret` 必须与命中的那条 `HOOK_CONFIG_JSON` 中的 `secret` 完全一致
- 初次联调建议先选 `Send me everything`

## 7. 自动部署推荐流程

推荐流程是：

1. 本地先执行一次 `npm run build`
2. 本地手动执行一次 `npm run deploy`
3. 在 GitHub Webhook 页面完成回填并验证链路
4. 确认无误后，再接入 GitHub Actions 自动发布

这样做的原因是先把 Worker 名称、域名、机器人权限、Webhook Secret 这些基础问题排干净，再自动化，风险更低。

## 8. 上线后的排障重点

### GitHub 返回 `403`

优先检查：

- GitHub Webhook 页面的 `Secret` 是否与目标配置一致
- 仓库名或组织名是否命中 `HOOK_CONFIG_JSON`
- `Content-Type` 是否为 `application/json`

### GitHub 返回成功但 Telegram 没消息

优先检查：

- 机器人是否已经加入目标聊天
- 机器人是否有发送消息权限
- `BOT_TOKEN` 是否正确
- 当前事件是否在支持列表内

### Worker 本身报错

优先检查：

- `HOOK_CONFIG_JSON` 是否是合法 JSON
- `HOOK_CONFIG_JSON` 结构中是否包含 `gh_webhooks`
- `chat_id` 是否为合法字符串或数字
- `secret` 是否为空字符串

## 9. 注意事项

- 本项目只接受 `POST /`，如果 GitHub Webhook 回调地址写成其他路径，会直接返回 `404`。
- 本项目只接受 `application/json`，不要把 GitHub Webhook 改成表单格式。
- `HOOK_CONFIG_JSON` 中如果同时配置组织和仓库，组织级规则优先。
- Worker 侧的 Secret 更新后，建议立即重新做一次 Webhook 投递验证，不要假设线上配置已经同步成功。


