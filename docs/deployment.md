# 部署教程

本文档说明如何把项目部署到 Cloudflare Workers，并配套启用 GitHub Actions 自动构建。

## 1. 前置条件
- 拥有 Cloudflare 账号
- 已安装 Node.js 20+
- 已安装 npm 10+
- 已有 Telegram Bot Token
- 已准备好 `HOOK_CONFIG_JSON`

## 2. Cloudflare 本地登录
第一次部署前，需要先让 Wrangler 连接你的 Cloudflare 账号：

```bash
npx wrangler login
```

登录成功后，Wrangler 会在本地保存授权信息。

## 3. 初始化生产环境变量
本项目运行至少需要两个变量：
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

### 3.1 使用 Wrangler Secret 设置 `BOT_TOKEN`
```bash
npx wrangler secret put BOT_TOKEN
```

执行后按提示输入真实 Token。

### 3.2 设置 `HOOK_CONFIG_JSON`
如果配置内容较短，可以直接在 `wrangler.toml` 对应环境中维护；如果希望统一保存在 Cloudflare 侧，也可以在部署命令中通过环境文件管理。

推荐做法：
1. 在本地准备单独的环境文件
2. 部署时通过 `--env-file` 注入

如果你希望走 GitHub Actions，则建议把它放入 GitHub Repository Secrets。

## 4. 本地打包验证
在真正部署前，先执行：

```bash
npm run build
```

该命令会：
1. 执行 TypeScript 类型检查
2. 通过 `wrangler deploy --dry-run` 完成打包
3. 输出 `dist/` 构建目录
4. 输出 `dist/bundle-meta.json`

## 5. 本地手动部署
```bash
npm run deploy
```

部署成功后，Wrangler 会输出 Worker 的地址，例如：

```text
https://github-webhook-to-telegram.<your-subdomain>.workers.dev
```

把这个地址填到 GitHub Webhook 的 `Payload URL`。

## 6. 配置 GitHub Actions 自动构建
仓库内已经包含自动构建工作流：`.github/workflows/python-package.yml`

当前行为：
- `push` 自动触发
- `pull_request` 自动触发
- 使用 Node.js 22
- 执行 `npm ci`
- 执行 `npm run typecheck`
- 执行 `npm run build`
- 执行 `npm test`
- 上传 `dist/` 作为构建产物，其中包含 `dist/bundle-meta.json`

### 6.1 查看构建结果
1. 打开 GitHub 仓库页面
2. 进入 `Actions`
3. 选择最新一次 `Node CI`
4. 在页面底部下载 `worker-build` artifact

## 7. 如果需要 GitHub Actions 自动部署
当前仓库默认只启用“自动构建”，不会自动发布到 Cloudflare。这样更安全，避免每次提交都直接上线。

如果后续需要自动部署，可以新增一个单独 workflow，并在 GitHub Secrets 中配置：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

然后仅在 `main` 分支发布时触发部署。

## 8. GitHub Secrets 建议
如果你要让 CI 也参与部署或集成测试，建议在仓库 `Settings -> Secrets and variables -> Actions` 中添加：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

注意：
- `BOT_TOKEN` 必须作为 Secret 保存
- `HOOK_CONFIG_JSON` 如果包含私密 chat_id 或 secret，也应当作为 Secret 保存

## 9. 线上排障建议
### Cloudflare 侧
- 用 `npx wrangler tail` 观察实时日志
- 检查环境变量是否存在拼写错误
- 检查 Worker 路由是否正确绑定

### GitHub 侧
- 在 Webhook Delivery 历史中查看响应状态和响应体
- 如果状态码是 `403`，优先看 secret 和仓库/组织映射

### Telegram 侧
- 确认机器人已进入目标聊天
- 确认机器人具备发送消息权限
- 确认目标 `chat_id` 与配置一致
