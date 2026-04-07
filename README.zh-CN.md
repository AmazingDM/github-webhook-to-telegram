# GitHub Webhook 转发到 Telegram

> English: [README.md](README.md)

这是一个运行在 Cloudflare Workers 上的服务，用于接收 GitHub Webhook，并将支持的事件通知转发到 Telegram 聊天。

当前代码库是对原始 Python `aiohttp` 版本的 TypeScript/Workers 重写，目标是在保留原有行为语义的前提下，提供更清晰的 Serverless 部署方式、测试覆盖和开源项目文档结构。

上游仓库引用：[dashezup/github-webhook-to-telegram](https://github.com/dashezup/github-webhook-to-telegram)

## 功能特性
- 在 `POST /` 接收 GitHub Webhook 请求
- 在处理负载前校验 `X-Hub-Signature-256` 签名
- 按仓库全名或组织名路由通知目标
- 将支持的 GitHub 事件渲染为结构化 Telegram HTML 消息
- 通过 Telegram Bot API 发送通知

## 项目结构
- `src/`：Worker 源码
- `src/formatters/`：按事件拆分的通知模板与共享格式化工具
- `test/`：Vitest 测试套件
- `docs/`：架构、使用、部署、迁移和参考文档
- `config_sample.json`：`HOOK_CONFIG_JSON` 示例
- `.dev.vars.example`：本地开发环境变量示例

## 环境要求
- Node.js 24+
- npm 10+
- 具备 Wrangler 访问能力的 Cloudflare 账号
- Telegram Bot Token

## 快速开始
1. 安装依赖：`npm install`
2. 复制 `.dev.vars.example` 为 `.dev.vars`
3. 填入 `BOT_TOKEN` 和 `HOOK_CONFIG_JSON`
4. 启动本地开发：`npm run dev`
5. 完整接入流程见 [docs/usage.zh-CN.md](docs/usage.zh-CN.md)
6. 部署路径和发布前提见 [docs/deployment.zh-CN.md](docs/deployment.zh-CN.md)

## 运行时配置
Worker 读取两个必填运行时变量。完整结构和匹配规则见 [docs/input-parameters.zh-CN.md](docs/input-parameters.zh-CN.md)。

- `BOT_TOKEN`
  由 [BotFather](https://t.me/BotFather) 创建的 Telegram Bot Token。
- `HOOK_CONFIG_JSON`
  一个单行 JSON 字符串，用于把仓库或组织映射到 Telegram 目标。

## 文档导航
英文文档：
- [Usage Guide](docs/usage.md)
- [Deployment Overview](docs/deployment.md)
- [GitHub Actions Deployment Guide](docs/deployment-actions.md)
- [Cloudflare Worker Deployment Guide](docs/deployment-worker-auto.md)
- [Input Parameters Reference](docs/input-parameters.md)
- [Architecture Overview](docs/architecture.md)
- [Migration Guide](docs/migration.md)
- [Changelog](docs/changelog.md)

中文文档：
- [使用教程](docs/usage.zh-CN.md)
- [部署总览](docs/deployment.zh-CN.md)
- [GitHub Actions 部署说明](docs/deployment-actions.zh-CN.md)
- [Cloudflare Worker 自动部署说明](docs/deployment-worker-auto.zh-CN.md)
- [传入参数说明](docs/input-parameters.zh-CN.md)
- [架构说明](docs/architecture.zh-CN.md)
- [迁移说明](docs/migration.zh-CN.md)
- [更新记录](docs/changelog.zh-CN.md)

## 测试覆盖
当前测试覆盖：
- 环境配置解析与路由匹配
- GitHub 请求头校验与签名校验
- 通知消息格式化
- Telegram API 成功/失败处理
- Worker 对 `404`、`405`、`403` 和成功请求的响应

## 许可证
项目继续使用 AGPL-3.0-or-later，详见 [LICENSE](LICENSE)。
