# 使用教程

本文档按照“准备 Telegram 机器人 -> 准备 GitHub Webhook -> 本地联调 -> 线上验证”的顺序说明如何使用本项目。

## 1. 准备 Telegram 机器人
1. 打开 [BotFather](https://t.me/BotFather)。
2. 发送 `/newbot` 创建机器人。
3. 按提示设置机器人名称和用户名。
4. 记录 BotFather 返回的 Token，这个值就是 `BOT_TOKEN`。

## 2. 确认目标聊天的 `chat_id`
### 发送到私聊
1. 在 Telegram 中打开你的机器人。
2. 点击 `Start`。
3. 通过第三方工具或 Telegram API 查询当前私聊的 `chat_id`。

### 发送到群组或频道
1. 把机器人加入群组或频道。
2. 给机器人授予发送消息权限。
3. 记录群组或频道的 `chat_id`。
4. 如果使用公开频道用户名，也可以直接填 `@channel_name`。

## 3. 编写 `HOOK_CONFIG_JSON`
`HOOK_CONFIG_JSON` 用于声明“哪个仓库或组织的 webhook 发到哪个 Telegram 聊天，以及用什么 secret 校验”。

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
- 键可以是仓库全名，如 `your-org/your-repo`
- 键也可以是组织名，如 `your-org`
- 如果同一个请求同时命中组织和仓库，本项目当前优先使用组织配置
- `secret` 需要和 GitHub Webhook 配置页中的 Secret 完全一致

## 4. 本地运行
### 4.1 安装依赖
```bash
npm install
```

### 4.2 准备本地环境变量
1. 复制 `.dev.vars.example` 为 `.dev.vars`
2. 替换其中的 `BOT_TOKEN`
3. 把 `HOOK_CONFIG_JSON` 改成你自己的配置

示例：

```dotenv
BOT_TOKEN=123456:your-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-a-random-secret"}}}
```

### 4.3 启动本地 Worker
```bash
npm run dev
```

默认会启动 Wrangler 本地开发服务。启动后可以看到本地地址，例如 `http://127.0.0.1:8787/`。

## 5. 本地验证
### 5.1 运行自动化测试
```bash
npm test
```

### 5.2 执行类型检查
```bash
npm run typecheck
```

### 5.3 执行打包检查
```bash
npm run build
```

构建成功后：
- `dist/` 中会生成 Worker 打包产物
- `dist/bundle-meta.json` 会记录打包元数据

### 5.4 手动发送 Webhook 请求
你可以先用任意测试 secret 构造一个 GitHub 风格请求，确认本地逻辑能通。

最简单的方式是先在测试中复用相同 payload 结构，再用脚本计算签名。

## 6. 配置 GitHub Webhook
进入目标仓库或组织的 `Settings -> Webhooks -> Add webhook`，按下面方式填写：

- `Payload URL`：你的 Worker 地址，例如 `https://your-worker.workers.dev/`
- `Content type`：`application/json`
- `Secret`：与 `HOOK_CONFIG_JSON` 中该目标项的 `secret` 保持一致
- `Which events would you like to trigger this webhook?`
  建议先选择 `Send me everything`，确认链路无误后再收敛到需要的事件

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

## 7. 验证线上消息
1. 在 GitHub Webhook 页面点击最近一次投递。
2. 确认返回状态为 `200`。
3. 打开对应 Telegram 聊天，确认机器人已经发出消息。
4. 如果 GitHub 返回 `403`，优先检查：
   - `Secret` 是否一致
   - `Content type` 是否为 `application/json`
   - 仓库或组织名称是否已写入 `HOOK_CONFIG_JSON`
5. 如果 GitHub 返回 `200` 但 Telegram 没有消息，检查：
   - 机器人是否已加入目标聊天
   - 机器人是否有发言权限
   - `BOT_TOKEN` 是否正确

## 8. 常见问题
### 收到 `403: Forbidden`
通常是以下原因之一：
- `X-Hub-Signature-256` 校验失败
- 仓库或组织未命中配置
- 请求头不符合 GitHub Webhook 规范

### Worker 部署成功但不发消息
- 检查 Cloudflare 环境变量是否真实生效
- 检查 Telegram 机器人是否能向该 `chat_id` 发消息
- 检查目标仓库触发的事件是否在支持列表中

### 消息里包含特殊字符导致格式异常
项目已经对 HTML 特殊字符做转义；如果你扩展了新的格式化逻辑，继续复用 `escapeHtml()` 即可
