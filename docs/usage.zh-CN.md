# 使用教程

> English: [usage.md](usage.md)

本文档按照“准备 Telegram 机器人 -> 配置路由 -> 本地验证 -> 线上验证”的顺序说明如何使用本项目。

## 1. 创建 Telegram 机器人
1. 打开 [BotFather](https://t.me/BotFather)。
2. 发送 `/newbot`。
3. 按提示设置机器人名称和用户名。
4. 记录 BotFather 返回的 Token，这就是 `BOT_TOKEN`。

## 2. 确认目标 `chat_id`
### 私聊
1. 在 Telegram 中打开机器人。
2. 点击 `Start`。
3. 使用 Telegram API 辅助工具或其他方式查询当前私聊的 `chat_id`。

### 群组或频道
1. 把机器人加入群组或频道。
2. 授予机器人发送消息权限。
3. 记录群组或频道的 `chat_id`。
4. 公开频道用户名（如 `@channel_name`）也可以直接使用。

## 3. 编写 `HOOK_CONFIG_JSON`
`HOOK_CONFIG_JSON` 用于声明哪个仓库或组织应该把通知发到哪个 Telegram 目标，以及 GitHub 需要使用哪个签名 Secret。

示例：
```json
{
  "gh_webhooks": {
    "your-org/your-repo": {
      "chat_id": -1001234567890,
      "secret": "replace-with-a-random-secret"
    },
    "your-org": {
      "chat_id": "@your_channel",
      "secret": "replace-with-another-secret"
    }
  }
}
```

说明：
- 键可以是仓库全名，例如 `your-org/your-repo`
- 键也可以是组织名，例如 `your-org`
- 如果仓库和组织同时命中，当前实现会优先使用组织级配置
- `secret` 必须与 GitHub Webhook 页面中的值完全一致

## 4. 本地运行
### 安装依赖
```bash
npm install
```

### 准备本地环境变量
1. 复制 `.dev.vars.example` 为 `.dev.vars`
2. 替换 `BOT_TOKEN`
3. 将 `HOOK_CONFIG_JSON` 改为你的真实配置

示例：
```dotenv
BOT_TOKEN=123456:your-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-a-random-secret"}}}
```

### 启动本地 Worker
```bash
npm run dev
```

Wrangler 会启动本地开发服务并输出地址，通常为 `http://127.0.0.1:8787/`。

## 5. 本地验证
### 运行自动化测试
```bash
npm test
```

### 执行类型检查
```bash
npm run typecheck
```

### 执行打包验证
```bash
npm run build
```

成功后：
- `dist/` 会包含 Worker 打包产物
- `dist/bundle-meta.json` 会记录打包元数据

## 6. 配置 GitHub Webhook
在目标仓库或组织的 `Settings -> Webhooks -> Add webhook` 中填写：
- `Payload URL`：Worker 地址，例如 `https://your-worker.workers.dev/`
- `Content type`：`application/json`
- `Secret`：必须与 `HOOK_CONFIG_JSON` 中命中的路由一致
- `Which events would you like to trigger this webhook?`
  建议先选择 `Send me everything`，验证链路后再收敛

当前支持的事件：
- `create`
- `delete`
- `discussion`
- `fork`
- `issues`
- `ping`
- `public`
- `pull_request`
- `push`
- `star`

## 7. 验证线上通知
1. 打开 GitHub Webhook 页面最近一次投递记录。
2. 确认 GitHub 返回成功状态。
3. 打开目标 Telegram 聊天，确认机器人消息已经送达。
4. 如果 GitHub 返回 `403`，优先检查：
   - Secret 是否一致
   - `Content type` 是否为 `application/json`
   - `HOOK_CONFIG_JSON` 是否包含对应仓库或组织
5. 如果 GitHub 成功但 Telegram 无消息，优先检查：
   - 机器人是否已加入目标聊天
   - 机器人是否有发言权限
   - `BOT_TOKEN` 是否正确

## 8. 常见问题
### `403: Forbidden`
常见原因：
- `X-Hub-Signature-256` 校验失败
- 仓库或组织未命中配置
- 请求头不符合 GitHub Webhook 规范

### Worker 部署成功但 Telegram 没消息
- 检查 Cloudflare 运行时变量是否已生效
- 检查 Telegram 机器人是否能向目标 `chat_id` 发消息
- 检查触发的事件是否在支持列表中

### 特殊字符导致消息格式异常
项目已经对 HTML 特殊字符做转义；如果你扩展了新的格式化逻辑，继续复用 `escapeHtml()` 即可。
