# Python 版本到 Workers 版本迁移说明

> English: [migration.md](migration.md)

## 迁移目标
旧版本基于 Python `aiohttp`，部署目标偏向 Heroku。新版本改为 Cloudflare Workers，以获得更轻量的 Serverless 部署体验。

## 主要映射关系
- `main.py` -> `src/index.ts`
  负责 HTTP 入口和请求分发。
- `config.py` -> `src/config.ts`
  负责从环境变量解析配置，而不是读取本地文件。
- `utils/github_webhook.py` -> `src/github.ts` + `src/formatters/`
  分离校验逻辑和格式化逻辑，提升可测试性。
- `utils/telegram.py` -> `src/telegram.ts`
  改为使用 Worker 原生 `fetch` 调用 Telegram API。

## 配置变化
旧版使用本地 `config.json` 或 Heroku 环境变量 `HOOK_CONFIG`。

新版统一使用：
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

## 部署变化
旧版依赖 `Procfile`、`runtime.txt`、`requirements.txt`。

新版依赖 `wrangler.toml` 和 Node.js 工具链。

## 测试变化
旧版只有 GitHub Actions 中的 Python lint。

新版增加了 Vitest 单元测试，覆盖配置解析、签名校验、消息格式化、Telegram 调用和 Worker 入口。
