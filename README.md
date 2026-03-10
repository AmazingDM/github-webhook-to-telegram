# GitHub Webhook to Telegram

> Simplified Chinese: [README.zh-CN.md](README.zh-CN.md)

A Cloudflare Workers service that receives GitHub webhooks and forwards supported events to Telegram chats.

The current codebase is a TypeScript/Workers rewrite of the original Python `aiohttp` implementation. The goal is to preserve the original behavior while providing a cleaner serverless deployment model, test coverage, and open-source project documentation.

Upstream repository: [dashezup/github-webhook-to-telegram](https://github.com/dashezup/github-webhook-to-telegram)

## Features
- Accept GitHub webhook requests on `POST /`
- Verify `X-Hub-Signature-256` signatures before processing payloads
- Route notifications by repository full name or organization name
- Render supported GitHub events as structured Telegram HTML messages
- Deliver messages through the Telegram Bot API

## Project Layout
- `src/`: Worker source code
- `src/formatters/`: event-specific notification templates and shared formatting helpers
- `test/`: Vitest test suite
- `docs/`: architecture, usage, deployment, migration, and reference docs
- `config_sample.json`: sample `HOOK_CONFIG_JSON` payload
- `.dev.vars.example`: local development environment example

## Requirements
- Node.js 20+
- npm 10+
- A Cloudflare account with Wrangler access
- A Telegram bot token

## Quick Start
1. Install dependencies: `npm install`
2. Copy `.dev.vars.example` to `.dev.vars`
3. Fill in `BOT_TOKEN` and `HOOK_CONFIG_JSON`
4. Start local development: `npm run dev`
5. Run tests: `npm test`
6. Run type checking: `npm run typecheck`
7. Validate the bundle: `npm run build`
8. Deploy to Cloudflare Workers: `npm run deploy`

## Runtime Configuration
The Worker reads two required runtime variables:

- `BOT_TOKEN`
  Telegram bot token created with [BotFather](https://t.me/BotFather).
- `HOOK_CONFIG_JSON`
  A single JSON string that maps repositories or organizations to Telegram targets.

Example:

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

## Development Commands
```bash
npm install
npm run dev
npm run typecheck
npm run build
npm test
npm run test:watch
npm run deploy
```

`npm run build` performs type checking and a dry-run Worker bundle build. The bundled output is written to `dist/`, including `dist/bundle-meta.json` for CI artifact inspection.

## Documentation
English documentation:
- [Usage Guide](docs/usage.md)
- [Deployment Overview](docs/deployment.md)
- [GitHub Actions Deployment Guide](docs/deployment-actions.md)
- [Cloudflare Worker Deployment Guide](docs/deployment-worker-auto.md)
- [Input Parameters Reference](docs/input-parameters.md)
- [Architecture Overview](docs/architecture.md)
- [Migration Guide](docs/migration.md)
- [Changelog](docs/changelog.md)

Chinese documentation:
- [使用教程](docs/usage.zh-CN.md)
- [部署总览](docs/deployment.zh-CN.md)
- [GitHub Actions 部署说明](docs/deployment-actions.zh-CN.md)
- [Cloudflare Worker 自动部署说明](docs/deployment-worker-auto.zh-CN.md)
- [传入参数说明](docs/input-parameters.zh-CN.md)
- [架构说明](docs/architecture.zh-CN.md)
- [迁移说明](docs/migration.zh-CN.md)
- [更新记录](docs/changelog.zh-CN.md)

## Testing Coverage
The test suite currently covers:
- environment configuration parsing and route matching
- GitHub header validation and signature checks
- notification formatting behavior
- Telegram API success and failure handling
- Worker responses for `404`, `405`, `403`, and successful webhook requests

## License
This project remains licensed under AGPL-3.0-or-later. See [LICENSE](LICENSE) for details.
