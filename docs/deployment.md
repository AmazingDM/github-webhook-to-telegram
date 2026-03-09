# 部署总览

当前仓库的部署说明拆分为两条链路，按职责分别阅读：

- [GitHub Actions 部署说明](deployment-actions.md)
  适合整理 CI、仓库 Secrets、构建产物和后续自动发布流程。
- [Cloudflare Worker 自动部署说明](deployment-worker-auto.md)
  适合整理 Worker 侧配置、Wrangler、运行时变量和 GitHub Webhook 回填信息。

## 1. 当前仓库现状

仓库已经包含工作流文件 [`.github/workflows/python-package.yml`](../.github/workflows/python-package.yml)，当前行为是：

- `push`、`pull_request`、`workflow_dispatch` 触发
- 执行 `npm ci`
- 执行 `npm run typecheck`
- 执行 `npm run build`
- 执行 `npm test`
- 上传 `dist/` 构建产物

当前工作流默认是“自动构建与校验”，不是“自动发布到 Cloudflare”。

## 2. 部署时一定会用到的内容

| 项目 | 用途 | 放置位置 | 格式 |
| --- | --- | --- | --- |
| `BOT_TOKEN` | Telegram 机器人发送消息 | Cloudflare Worker Secret / GitHub Secret | 单行字符串 |
| `HOOK_CONFIG_JSON` | 仓库或组织与 Telegram 目标映射 | Cloudflare Worker Secret / GitHub Secret | 单行 JSON 字符串 |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions 发布 Worker | GitHub Actions Secret | 单行字符串 |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions 发布 Worker | GitHub Actions Secret | 单行字符串 |
| Worker 地址 | 回填到 GitHub Webhook `Payload URL` | GitHub Webhook 配置页 | 完整 HTTPS URL |
| Webhook Secret | GitHub 请求签名校验 | GitHub Webhook 配置页 | 与 `HOOK_CONFIG_JSON` 中目标项的 `secret` 完全一致 |

## 3. 最小填写模板

### 3.1 GitHub / Cloudflare Secrets

```dotenv
BOT_TOKEN=123456:replace-with-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
CLOUDFLARE_API_TOKEN=replace-with-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=replace-with-cloudflare-account-id
```

### 3.2 `HOOK_CONFIG_JSON`

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

### 3.3 GitHub Webhook 页面填写

```text
Payload URL: https://<your-worker>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: replace-with-random-secret
Events: Send me everything
Active: checked
```

## 4. 注意事项

- `HOOK_CONFIG_JSON` 在 Worker 环境里必须是单行 JSON 字符串，不能直接粘贴带注释或多余换行的 JSON。
- GitHub Webhook 页面的 `Secret` 必须和命中的那一项 `HOOK_CONFIG_JSON.gh_webhooks[*].secret` 完全一致。
- 当前代码会优先按 `organization.login` 匹配，其次才是 `repository.full_name`；如果两者都配置了，组织级配置会先命中。
- 机器人必须先加入目标群组或频道，并具备发言权限，否则部署成功后仍然不会收到通知。
- 如果 Actions 只做构建校验，不要在文档里把它描述成“已自动发布”，避免运维认知偏差。

## 5. 推荐阅读顺序

1. 先看 [Cloudflare Worker 自动部署说明](deployment-worker-auto.md)，完成 Worker 与 Webhook 配置。
2. 再看 [GitHub Actions 部署说明](deployment-actions.md)，决定是否要接入自动发布。


