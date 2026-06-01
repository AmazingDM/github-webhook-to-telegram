# Cloudflare Worker 自动部署说明

> English: [deployment-worker-auto.md](deployment-worker-auto.md)

本文档说明 Cloudflare 侧需要知道的内容。推荐流程是 GitHub Actions 自动部署，不需要在 Cloudflare 控制台手动粘贴代码。

## 关键文件
| 文件 | 作用 |
| --- | --- |
| [../wrangler.toml](../wrangler.toml) | Worker 名称、入口文件、兼容日期 |
| [../.node-version](../.node-version) | GitHub/Cloudflare 构建时使用的 Node.js 主版本 |
| [../src/index.ts](../src/index.ts) | Worker 入口 |
| [../.github/workflows/cloudflare-worker-deploy.yml](../.github/workflows/cloudflare-worker-deploy.yml) | 手动发布和 tag 自动发布 workflow |
| [../.github/workflows/sync-upstream.yml](../.github/workflows/sync-upstream.yml) | fork 仓库每日安全同步上游的 workflow |

## `wrangler.toml`
默认配置：

```toml
name = "github-webhook-to-telegram"
main = "src/index.ts"
compatibility_date = "2026-03-08"
```

fork 后通常只需要考虑是否修改 `name`。如果你保留默认值，Worker URL 中会包含 `github-webhook-to-telegram`。

## Worker Secrets
部署 workflow 会在 `pnpm run deploy` 成功后同步两个 Worker Secrets：
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

你不需要手动在 Cloudflare 控制台创建它们。它们来自 fork 仓库的 GitHub Actions Secrets。

## Webhook URL
部署成功后，Cloudflare Worker URL 通常类似：

```text
https://<worker-name>.<your-subdomain>.workers.dev/
```

把这个 URL 填到 GitHub Webhook 的 `Payload URL`。

## GitHub Webhook 填写
在目标仓库或组织中打开：

`Settings -> Webhooks -> Add webhook`

填写：

```text
Payload URL: https://<worker-name>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: replace-with-random-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

`Secret` 必须等于 `HOOK_CONFIG_JSON` 中命中的路由 `secret`。

## 推荐上线顺序
1. Fork 仓库。
2. 填 GitHub Actions Secrets。
3. 手动运行 `Cloudflare Worker Deploy`，或推送 tag 触发部署。
4. 等 `Cloudflare Worker Deploy` workflow 成功。
5. 获取 Worker URL。
6. 添加 GitHub Webhook。
7. 用 Webhook 页面里的 `ping` 投递记录验证。

同步上游不会自动部署。同步产生的普通分支 push 只会运行检查；如果你希望生产环境也更新，需要手动运行 deploy workflow 或推送新 tag。

## 排障
### GitHub Actions 部署失败
优先看失败步骤：
- install 失败：检查 `pnpm-lock.yaml` 是否和 `package.json` 一致。
- typecheck/test/build 失败：按日志修复代码或依赖。
- deploy 失败：检查 Cloudflare API Token 和 Account ID。
- secret sync 失败：检查 Cloudflare API Token 权限。

### GitHub Webhook 返回 `403`
检查：
- Webhook 页面填写的 `Secret` 是否等于 `HOOK_CONFIG_JSON` 中命中的 `secret`。
- Webhook `Content type` 是否是 `application/json`。
- `HOOK_CONFIG_JSON` 是否包含目标仓库全名或组织名。

### GitHub Webhook 成功但 Telegram 没消息
检查：
- 机器人是否加入目标聊天。
- 机器人是否有发送权限。
- `BOT_TOKEN` 是否来自正确机器人。
- 事件类型是否受支持。

### 改了 Secrets 但没有生效
GitHub Actions Secrets 变更不会自动同步到 Worker。手动运行 deploy workflow，或推送一个新 tag 重新部署，workflow 才会把新值同步到 Cloudflare Worker。
