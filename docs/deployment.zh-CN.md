# 部署总览

> English: [deployment.md](deployment.md)

当前仓库把自动化拆成两个 GitHub Actions workflow，加上一份 Worker 运行时配置说明：

- [GitHub Actions 部署说明](deployment-actions.zh-CN.md)
  说明 checks workflow、deploy workflow、必需的 GitHub Secrets 和发布规则。
- [Cloudflare Worker 自动部署说明](deployment-worker-auto.zh-CN.md)
  说明 Worker 运行时配置、Wrangler、Worker Secrets 和 GitHub Webhook 回填内容。

## 当前自动化结构
仓库包含两个 workflow：

| Workflow 文件 | 作用 | 触发条件 |
| --- | --- | --- |
| [`.github/workflows/cloudflare-worker-checks.yml`](../.github/workflows/cloudflare-worker-checks.yml) | 安装、类型检查、构建、测试、上传 `dist/` | `push`、`pull_request`、`workflow_dispatch` |
| [`.github/workflows/cloudflare-worker-deploy.yml`](../.github/workflows/cloudflare-worker-deploy.yml) | 校验、发布到 Cloudflare，然后同步 Worker Secrets | `main` 分支 `push`、`workflow_dispatch` |

## 部署必备输入项
| 项目 | 用途 | 存放位置 | 格式 |
| --- | --- | --- | --- |
| `BOT_TOKEN` | Telegram 消息发送 | GitHub Actions Secret 和 Cloudflare Worker Secret | 单行字符串 |
| `HOOK_CONFIG_JSON` | 仓库或组织路由映射 | GitHub Actions Secret 和 Cloudflare Worker Secret | 单行 JSON 字符串 |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions 发布认证 | GitHub Actions Secret | 单行字符串 |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions 发布目标 | GitHub Actions Secret | 单行字符串 |
| Worker 地址 | GitHub Webhook `Payload URL` | GitHub Webhook 设置页 | 完整 HTTPS URL |
| Webhook Secret | 请求签名校验 | GitHub Webhook 设置页 | 必须与 `HOOK_CONFIG_JSON` 中命中的 `secret` 一致 |

具体模板和逐步操作集中在两份专题文档中：
- [GitHub Actions 部署说明](deployment-actions.zh-CN.md)：仓库 Secrets、CI 和发布规则
- [Cloudflare Worker 自动部署说明](deployment-worker-auto.zh-CN.md)：Worker Secrets、`HOOK_CONFIG_JSON`、Webhook 页面填写和上线检查

## 注意事项
- checks workflow 只负责 CI 校验，不能承担发布职责。
- deploy workflow 在发布前会重新执行类型检查、构建和测试，不会跳过校验直接上线。
- 当前 deploy workflow 先执行 `npm run deploy`，再用 `wrangler secret put` 同步 `BOT_TOKEN` 和 `HOOK_CONFIG_JSON`。
- GitHub Webhook 页面的 `Secret` 必须与命中的 `HOOK_CONFIG_JSON.gh_webhooks[*].secret` 完全一致。
- 当前实现会优先按 `organization.login` 匹配，其次才是 `repository.full_name`；两者都命中时组织级配置优先。
