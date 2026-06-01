# GitHub Actions 部署说明

> English: [deployment-actions.md](deployment-actions.md)

本文档只说明 GitHub 侧配置。fork 用户最重要的动作是：填 4 个 repository secrets，然后手动运行发布 workflow 或推送 tag。

## Workflow
| 文件 | 触发条件 | 做什么 |
| --- | --- | --- |
| [../.github/workflows/cloudflare-worker-checks.yml](../.github/workflows/cloudflare-worker-checks.yml) | 分支 push、Pull Request、手动触发 | 安装依赖、类型检查、构建、测试 |
| [../.github/workflows/cloudflare-worker-deploy.yml](../.github/workflows/cloudflare-worker-deploy.yml) | 手动触发、Git tag push | 先检查，再发布 Worker，再同步 Worker Secrets |
| [../.github/workflows/sync-upstream.yml](../.github/workflows/sync-upstream.yml) | 每日定时、手动触发 | 安全时把 fork `main` 快进到上游最新版本 |

## 必填 Secrets
进入 fork 仓库：

`Settings -> Secrets and variables -> Actions -> New repository secret`

逐个添加：

| Secret | 来源 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token 页面 | `wrangler deploy` 发布 Worker，建议具备 `Account Settings` read 和 `Workers Scripts` edit |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号首页 | 指定部署到哪个账号 |
| `BOT_TOKEN` | Telegram BotFather | Worker 调用 Telegram Bot API |
| `HOOK_CONFIG_JSON` | 你自己编写 | Worker 路由 GitHub 仓库或组织到 Telegram 聊天 |

`HOOK_CONFIG_JSON` 示例：

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

## 发布方式
部署 workflow 不响应普通提交。你可以手动发布，也可以用 tag 自动发布。

### 手动发布
1. 打开 fork 仓库的 `Actions`。
2. 选择 `Cloudflare Worker Deploy`。
3. 点击 `Run workflow`。
4. 选择发布分支，通常是 `main`。
5. 点击确认运行。

### tag 自动发布

```bash
git tag v1.0.0
git push origin v1.0.0
```

如果要重新发布同一个版本，不建议复用旧 tag。推荐创建新 tag：

```bash
git tag v1.0.1
git push origin v1.0.1
```

## 保持 fork 更新
`Sync Upstream` workflow 面向 fork 用户，用于自动获取上游修复，减少手动拉取成本。

它每天运行一次，也可以手动启动：

`Actions -> Sync Upstream -> Run workflow`

行为规则：
- 在上游仓库自身不会执行同步；
- 会拉取 `AmazingDM/github-webhook-to-telegram`；
- 当你的 fork 没有本地独有提交时，快进更新 `main`；
- 如果 fork 已经分叉，拒绝强推覆盖。

如果 push 步骤返回 `403`，打开 fork 仓库的 `Settings -> Actions -> General -> Workflow permissions`，启用 `Read and write permissions`。

## Workflow 内部顺序
部署 workflow 会按顺序执行：
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm build`
4. `pnpm test`
5. `pnpm run deploy`
6. `wrangler secret put BOT_TOKEN`
7. `wrangler secret put HOOK_CONFIG_JSON`

任何一步失败都会停止部署。

## 常见错误
### `ERR_PNPM_OUTDATED_LOCKFILE`
`package.json` 和 `pnpm-lock.yaml` 不一致。解决方式：

```bash
pnpm install --lockfile-only
```

然后提交更新后的 `pnpm-lock.yaml`。

### `ERR_PNPM_CANNOT_DEPLOY`
说明命令写成了 `pnpm deploy`。正确命令是：

```bash
pnpm run deploy
```

### Cloudflare 认证失败
检查：
- `CLOUDFLARE_API_TOKEN` 是否填错。
- `CLOUDFLARE_ACCOUNT_ID` 是否填错。
- API Token 是否有发布 Workers 的权限。

### 同步 workflow 拒绝更新
说明你的 fork 有上游不存在的提交。手动 merge 或 rebase 上游，推送解决后的 `main`，然后重新运行 `Sync Upstream`。

## 安全规则
- 不要把 token 写进代码、文档或 `.dev.vars` 后提交。
- 不要在普通分支 push 中发布生产环境。
- 用手动 deploy workflow 或 tag push 触发发布。
- 上游同步 workflow 只做快进更新，不能覆盖 fork 自己的提交。
