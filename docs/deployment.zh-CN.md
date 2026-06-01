# 部署总览

> English: [deployment.md](deployment.md)

这份文档面向 fork 用户。你不需要改代码，也不需要在 Cloudflare 控制台手动创建 Worker；只要准备好 GitHub Secrets，然后手动运行发布 workflow 或推送 Git tag，GitHub Actions 就会部署。

## 部署结果
完成后你会得到：
- 一个 Cloudflare Worker URL，用作 GitHub Webhook 的 `Payload URL`。
- 一个 Telegram Bot，用来接收 GitHub 事件通知。
- 一套 GitHub Actions 发布流程：普通提交只测试，手动运行 deploy workflow 或 tag 推送才发布。
- 一个每日自动同步 workflow，在 fork 未自行改代码时跟随上游更新。

## 1. Fork 仓库
1. 打开原仓库页面。
2. 点击 `Fork`。
3. 进入你自己的 fork 仓库。

后续所有设置都在你的 fork 仓库里完成。

如果 GitHub 提示需要启用 Actions，先在 fork 仓库中启用后再继续。

## 2. 准备 Telegram
1. 打开 [BotFather](https://t.me/BotFather)，发送 `/newbot` 创建机器人。
2. 记录 BotFather 返回的 Token，这就是 `BOT_TOKEN`。
3. 把机器人加入你要接收通知的群组、频道或私聊。
4. 准备目标聊天 ID：
   - 私聊或群组通常使用数字 ID，例如 `-1001234567890`。
   - 公开频道可以使用 `@channel_name`。

## 3. 准备 Cloudflare
1. 登录 Cloudflare。
2. 找到 Account ID。
3. 打开 `My Profile -> API Tokens -> Create Token`。
4. 创建一个可发布 Workers 的 API Token。

推荐权限：
- Account: `Account Settings` read
- Account: `Workers Scripts` edit

如果你的 Cloudflare 页面提供 Workers 相关模板，也可以从模板创建，再确认它能编辑目标账号下的 Worker。

## 4. 编写 `HOOK_CONFIG_JSON`
`HOOK_CONFIG_JSON` 用来告诉 Worker：哪个 GitHub 仓库或组织的通知，应该发到哪个 Telegram 目标，并使用哪个 Webhook Secret 校验签名。

单仓库示例：

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

组织级示例：

```json
{"gh_webhooks":{"your-org":{"chat_id":"@your_channel","secret":"replace-with-random-secret"}}}
```

规则：
- key 可以是仓库全名，如 `your-name/your-repo`。
- key 也可以是组织名，如 `your-org`。
- 如果组织和仓库同时匹配，组织配置优先。
- `secret` 必须和 GitHub Webhook 页面填写的 `Secret` 完全一致。
- 保存到 GitHub Secrets 时必须是一行 JSON，不能带注释。

## 5. 填写 GitHub Actions Secrets
进入你的 fork 仓库：

`Settings -> Secrets and variables -> Actions -> New repository secret`

添加 4 个 Secrets：

| Secret | 示例 | 说明 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | `***` | Cloudflare API Token，需能发布 Worker |
| `CLOUDFLARE_ACCOUNT_ID` | `0123456789abcdef...` | Cloudflare Account ID |
| `BOT_TOKEN` | `123456:ABC...` | Telegram Bot Token |
| `HOOK_CONFIG_JSON` | `{"gh_webhooks":{...}}` | 一行路由 JSON |

不要把这些值提交到仓库。

## 6. 确认 Worker 名称
默认 Worker 名称在 [../wrangler.toml](../wrangler.toml)：

```toml
name = "github-webhook-to-telegram"
```

如果你想换名字，修改这个 `name` 后提交到你的 fork。

## 7. 触发部署
普通 `push` 只会运行检查，不会部署。你可以用两种方式发布。

### 方式 A：手动发布
1. 打开 fork 仓库的 `Actions`。
2. 选择 `Cloudflare Worker Deploy`。
3. 点击 `Run workflow`。
4. 选择要发布的分支，通常是 `main`。
5. 再次点击 `Run workflow`。

### 方式 B：tag 自动发布
推送 Git tag：

```bash
git tag v1.0.0
git push origin v1.0.0
```

然后打开：

`Actions -> Cloudflare Worker Deploy`

确认 workflow 成功。成功后 Worker 会部署到 Cloudflare，并把 `BOT_TOKEN`、`HOOK_CONFIG_JSON` 同步为 Worker Secrets。

## 8. 配置 GitHub Webhook
部署成功后，到你要监听的仓库或组织中添加 Webhook：

`Settings -> Webhooks -> Add webhook`

填写：

```text
Payload URL: https://<worker-name>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: replace-with-random-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

`Secret` 必须等于 `HOOK_CONFIG_JSON` 中命中的 `secret`。

## 9. 验证
1. 在 GitHub Webhook 页面点击最近一次 `ping` delivery。
2. 确认响应是成功状态。
3. 打开 Telegram，确认收到消息。
4. 如果没有消息，先看 [deployment-worker-auto.zh-CN.md](deployment-worker-auto.zh-CN.md) 的排障部分。

## 10. 保持 fork 更新
`Sync Upstream` workflow 会每天运行一次，也可以在 `Actions -> Sync Upstream -> Run workflow` 手动启动。

它只会在安全时把你的 fork `main` 分支快进到 `AmazingDM/github-webhook-to-telegram` 的最新版本。如果你的 fork 有上游不存在的本地提交，workflow 会失败并提示原因，不会强制覆盖你的改动。

如果 workflow 没有权限 push，打开 fork 仓库的 `Settings -> Actions -> General -> Workflow permissions`，启用 `Read and write permissions`。

## 自动化规则
| 场景 | 结果 |
| --- | --- |
| 分支 push | 安装、类型检查、构建、测试 |
| Pull Request | 安装、类型检查、构建、测试 |
| 手动运行 checks workflow | 安装、类型检查、构建、测试 |
| 手动运行 deploy workflow | 安装、类型检查、构建、测试、发布 Worker、同步 Worker Secrets |
| 推送 Git tag | 安装、类型检查、构建、测试、发布 Worker、同步 Worker Secrets |
| 每日同步 workflow | 安全时把 fork `main` 快进到上游最新版本 |

## 继续阅读
- [GitHub Actions 部署说明](deployment-actions.zh-CN.md)
- [Cloudflare Worker 自动部署说明](deployment-worker-auto.zh-CN.md)
- [使用教程](usage.zh-CN.md)
