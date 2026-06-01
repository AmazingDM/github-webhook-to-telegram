# GitHub Webhook 转发到 Telegram

> English: [README.md](README.md)

这是一个 Cloudflare Workers 服务：接收 GitHub Webhook，校验签名，然后把支持的事件转发到 Telegram。

这个仓库的推荐使用方式是：fork 本仓库，填好 GitHub Actions Secrets，然后通过手动运行 workflow 或推送 Git tag 部署到 Cloudflare Worker。

## 最短部署流程
1. Fork 本仓库到你的 GitHub 账号。
2. 准备 Telegram Bot Token，并让机器人加入目标聊天。
3. 准备 Cloudflare API Token 和 Account ID。
4. 在 fork 后的仓库中打开 `Settings -> Secrets and variables -> Actions -> New repository secret`。
5. 添加以下 4 个 Secrets：

| Secret | 说明 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 用于发布 Worker 的 Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `BOT_TOKEN` | Telegram Bot Token |
| `HOOK_CONFIG_JSON` | 仓库或组织到 Telegram 目标的路由 JSON |

`HOOK_CONFIG_JSON` 必须是一行 JSON，例如：

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

6. 如需改 Worker 名称，编辑 [wrangler.toml](wrangler.toml) 中的 `name`。
7. 选择一种发布方式：

手动发布：打开 `Actions -> Cloudflare Worker Deploy -> Run workflow`。

tag 自动发布：

```bash
git tag v1.0.0
git push origin v1.0.0
```

8. 部署成功后，在目标 GitHub 仓库或组织中添加 Webhook：

```text
Payload URL: https://<你的-worker>.<你的子域>.workers.dev/
Content type: application/json
Secret: 必须等于 HOOK_CONFIG_JSON 中命中的 secret
Events: Send me everything
Active: checked
```

完整步骤见 [docs/deployment.zh-CN.md](docs/deployment.zh-CN.md)。

## 本地检查
本地开发不是部署必需项，但可以用来验证 fork 后的改动：

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

本地运行 Worker：

```bash
cp .dev.vars.example .dev.vars
pnpm dev
```

## 文档
- [部署总览](docs/deployment.zh-CN.md)：fork 用户从准备到上线的完整路径。
- [GitHub Actions 部署](docs/deployment-actions.zh-CN.md)：Secrets、手动发布、tag 发布和 workflow 行为。
- [Worker 配置](docs/deployment-worker-auto.zh-CN.md)：Cloudflare、Wrangler、Webhook 回填和排障。
- [使用教程](docs/usage.zh-CN.md)：Telegram、`HOOK_CONFIG_JSON`、Webhook 验证。
- [更新记录](docs/changelog.zh-CN.md)：项目主要变更。

## Fork 更新
fork 仓库内置 `Sync Upstream` workflow，每天自动检查上游并在没有 fork 本地独有提交时快进更新 `main` 分支。如果你的 fork 已经产生分叉，workflow 会停止，避免覆盖你的改动；手动合并上游后再重新运行即可。

## 支持的事件
`create`、`delete`、`discussion`、`fork`、`issues`、`ping`、`public`、`pull_request`、`push`、`star`

## 许可证
AGPL-3.0-or-later，见 [LICENSE](LICENSE)。
