# GitHub Actions 部署说明

本文档只负责 GitHub 侧内容：工作流、仓库 Secrets、构建产物，以及如何把当前 CI 扩展为自动发布。

## 1. 当前工作流说明

仓库当前工作流文件为 [`.github/workflows/python-package.yml`](../.github/workflows/python-package.yml)。

当前已经做的事情：

- 在 `push`、`pull_request`、`workflow_dispatch` 时触发
- 安装依赖：`npm ci`
- 类型检查：`npm run typecheck`
- 打包校验：`npm run build`
- 单元测试：`npm test`
- 上传构建产物：`dist/`

当前还没做的事情：

- 没有自动执行 `wrangler deploy`
- 没有自动把 GitHub Secrets 同步成 Cloudflare Worker Secrets
- 没有区分测试环境与生产环境

## 2. 适用场景

### 只做 CI 校验

适合当前默认状态：

- 每次提交都检查代码是否可安装、可构建、可测试
- 不直接发布到线上
- 线上部署通过本地 `npm run deploy` 或单独发布流程完成

### CI + 自动发布

适合生产分支明确、发布权限收敛、希望减少手工部署的场景：

- 仅在 `main` 分支发布
- `typecheck`、`build`、`test` 全部通过后再发布
- Cloudflare 令牌和业务变量统一由 GitHub Actions Secrets 管理

## 3. 需要填写的 GitHub Secrets

进入仓库：

`Settings -> Secrets and variables -> Actions`

建议至少维护以下四项：

| Secret 名称 | 必填 | 用途 | 格式 |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | 自动发布时必填 | 调用 Cloudflare API 发布 Worker | 单行字符串 |
| `CLOUDFLARE_ACCOUNT_ID` | 自动发布时必填 | 指定 Cloudflare 账号 | 单行字符串 |
| `BOT_TOKEN` | 推荐 | 作为 Worker Secret 同步到线上 | Telegram Token 单行字符串 |
| `HOOK_CONFIG_JSON` | 推荐 | 作为 Worker Secret 同步到线上 | 单行 JSON 字符串 |

填写模板：

```dotenv
CLOUDFLARE_API_TOKEN=replace-with-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=replace-with-cloudflare-account-id
BOT_TOKEN=123456:replace-with-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

## 4. 推荐的发布规则

如果要把当前 CI 扩展成自动发布，建议保持下面这组约束：

- 只允许 `main` 分支自动发布
- `pull_request` 只做检查，不做发布
- 发布前必须通过 `npm run typecheck`、`npm run build`、`npm test`
- 生产变量只保存在 GitHub Secrets 和 Cloudflare Secrets，不写入仓库

## 5. Actions 文档里需要写清楚的内容

建议在团队文档里固定写明以下字段，避免后续交接时只能靠猜：

| 字段 | 示例 | 说明 |
| --- | --- | --- |
| 工作流文件 | `.github/workflows/python-package.yml` | 当前仓库实际生效的工作流路径 |
| 触发分支 | `main` | 自动发布时应明确写死 |
| 构建命令 | `npm run build` | 会执行类型检查和 Worker 干跑打包 |
| 测试命令 | `npm test` | 发布前的测试门禁 |
| 发布命令 | `npm run deploy` | 实际调用 `wrangler deploy` |
| 构建产物 | `dist/` | 便于回溯打包结果 |

## 6. 注意事项

- `HOOK_CONFIG_JSON` 在 GitHub Secret 中应保持单行，避免 YAML 或 Secret 注入时被错误换行。
- 不要把 `BOT_TOKEN`、`HOOK_CONFIG_JSON` 写进 `wrangler.toml`、`README.md` 或示例工作流明文里。
- 如果后续新增“自动发布”步骤，文档里必须明确“当前默认工作流是否已经上线发布”，不要让 CI 和 CD 混为一谈。
- 当前工作流文件名虽然是 `python-package.yml`，但实际跑的是 Node/Workers 流程；文档里应直接点出这件事，避免维护者误判。
- 自动发布前先确保至少完成一次本地手动部署，确认 Worker 名称、账号和路由都是正确的。

## 7. 推荐验收方式

1. 提交一个普通分支，确认 `push` / `pull_request` 能通过构建与测试。
2. 检查 Actions 产物中是否存在 `dist/` 和 `dist/bundle-meta.json`。
3. 如果接入自动发布，再验证 `main` 分支发布后 Cloudflare 线上版本是否更新。


