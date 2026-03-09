# GitHub Actions 部署说明

> English: [deployment-actions.md](deployment-actions.md)

本文档只覆盖 GitHub 侧自动化：checks workflow、deploy workflow、仓库 Secrets 和发布规则。

## Workflow 文件
仓库使用两个 workflow 文件：

| Workflow 文件 | 作用 | 触发条件 |
| --- | --- | --- |
| [`.github/workflows/cloudflare-worker-checks.yml`](../.github/workflows/cloudflare-worker-checks.yml) | 安装依赖、类型检查、构建、测试、上传 `dist/` | `push`、`pull_request`、`workflow_dispatch` |
| [`.github/workflows/cloudflare-worker-deploy.yml`](../.github/workflows/cloudflare-worker-deploy.yml) | 校验、同步 Worker Secrets、发布到 Cloudflare | `main` 分支 `push`、`workflow_dispatch` |

## Checks Workflow
checks workflow 是仓库的 CI 路径，负责：
- 通过 `npm ci` 安装依赖
- 执行 `npm run typecheck`
- 执行 `npm run build`
- 执行 `npm test`
- 上传 `dist/` 构建产物

这个 workflow 必须保持不发布生产环境，这样 PR 和普通 push 都不会误上线。

## Deploy Workflow
deploy workflow 是发布路径。它会：
- 在 `main` 分支 push 和手动触发时运行
- 在部署前重新执行类型检查、构建和测试
- 通过 `npm run deploy` 发布 Worker
- 在代码部署成功后，通过 `wrangler secret put` 把 `BOT_TOKEN` 和 `HOOK_CONFIG_JSON` 同步到 Cloudflare

## 必需的 GitHub Secrets
进入 `Settings -> Secrets and variables -> Actions`，配置：

| Secret | 必填 | 用途 | 格式 |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | 是 | 发布时的 Cloudflare API 认证 | 单行字符串 |
| `CLOUDFLARE_ACCOUNT_ID` | 是 | 指定 Cloudflare 账号 | 单行字符串 |
| `BOT_TOKEN` | 是 | 发布前同步到 Worker 运行时 | Telegram Token 字符串 |
| `HOOK_CONFIG_JSON` | 是 | 发布前同步到 Worker 运行时 | 单行 JSON 字符串 |

模板：
```dotenv
CLOUDFLARE_API_TOKEN=replace-with-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=replace-with-cloudflare-account-id
BOT_TOKEN=123456:replace-with-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

## 发布规则
除非发布模型有意调整，否则建议固定以下规则：
- 只有 deploy workflow 可以发布到 Cloudflare
- 只有 `main` 分支 push 和手动触发可以上线
- 部署必须在同一次 workflow 中通过类型检查、构建和测试
- Secrets 只保存在 GitHub Actions 和 Cloudflare Secret Store 中

## 注意事项
- `HOOK_CONFIG_JSON` 在 GitHub Secret 中保持单行，避免 shell 和 YAML 注入问题。
- checks workflow 只用于校验，不要把它变成隐藏的发布入口。
- 依赖自动发布前，先完成至少一次手动部署和 webhook 验证。
