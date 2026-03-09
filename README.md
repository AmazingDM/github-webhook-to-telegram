# GitHub Webhook 转发到 Telegram

这个项目运行在 Cloudflare Workers 上，用于接收 GitHub Webhook，并将事件消息转发到 Telegram 聊天。

当前版本已经从 Python `aiohttp` 服务重写为 TypeScript Worker，目标是保留原有功能语义，同时补齐更适合 Serverless 的构建、测试和部署流程。

## 功能概览
- 接收 GitHub `POST /` Webhook 请求
- 校验 `X-Hub-Signature-256` 签名
- 按仓库或组织映射转发目标 Telegram 聊天
- 将支持的 GitHub 事件格式化为 Telegram HTML 消息
- 通过 Telegram Bot API `sendMessage` 发送通知

## 目录说明
- `src/`：Worker 源码
- `test/`：Vitest 测试
- `docs/`：架构、迁移和更新记录
- `config_sample.json`：`HOOK_CONFIG_JSON` 的示例内容
- `.dev.vars.example`：本地开发环境变量示例

## 环境要求
- Node.js 20+
- npm 10+
- Cloudflare 账号与 Wrangler CLI

## 快速开始
1. 安装依赖：`npm install`
2. 准备本地变量：复制 `.dev.vars.example` 为 `.dev.vars`
3. 填入真实的 `BOT_TOKEN` 与 `HOOK_CONFIG_JSON`
4. 本地启动：`npm run dev`
5. 运行测试：`npm test`
6. 构建检查：`npm run build`
7. 发布到 Cloudflare：`npm run deploy`

## 配置说明
Worker 运行时使用以下环境变量：

- `BOT_TOKEN`
  Telegram 机器人 Token，可通过 [BotFather](https://t.me/BotFather) 创建。
- `HOOK_CONFIG_JSON`
  单个 JSON 字符串，结构与 `config_sample.json` 一致。

示例：

```json
{
  "gh_webhooks": {
    "Codertocat/Hello-World": {
      "chat_id": -1001234567890,
      "secret": "FPAh9pwRHCLpRL7j"
    },
    "octo-org": {
      "chat_id": "@username",
      "secret": "KLrYeiA3vNLPVbAv"
    }
  }
}
```

本地开发时可复制 `.dev.vars.example` 为 `.dev.vars` 并填入真实值。

## 开发与打包
安装依赖：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

类型检查：

```bash
npm run typecheck
```

打包验证：

```bash
npm run build
```

运行测试：

```bash
npm test
```

持续监听测试：

```bash
npm run test:watch
```

部署到 Cloudflare Workers：

```bash
npm run deploy
```

`npm run build` 会在 `dist/` 下生成 Worker 打包产物，并输出 `dist/bundle-meta.json`，方便 GitHub Actions 归档自动构建结果。

## 详细教程
- [使用教程](docs/usage.md)
- [部署总览](docs/deployment.md)
- [GitHub Actions 部署说明](docs/deployment-actions.md)
- [Cloudflare Worker 自动部署说明](docs/deployment-worker-auto.md)
- [传入参数说明](docs/input-parameters.md)

## 测试范围
当前测试覆盖以下关键路径：
- 配置 JSON 解析与目标映射
- GitHub 请求头和签名校验
- GitHub 事件消息格式化
- Telegram API 成功/失败处理
- Worker 入口对 404/405/403/成功请求的响应

## 文档
- [架构说明](docs/architecture.md)
- [传入参数说明](docs/input-parameters.md)
- [使用教程](docs/usage.md)
- [部署总览](docs/deployment.md)
- [GitHub Actions 部署说明](docs/deployment-actions.md)
- [Cloudflare Worker 自动部署说明](docs/deployment-worker-auto.md)
- [迁移说明](docs/migration.md)
- [更新记录](docs/changelog.md)

## 许可
项目继续沿用 AGPL-3.0-or-later，详见 `LICENSE`。


