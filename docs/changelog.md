# Changelog

> Simplified Chinese: [changelog.zh-CN.md](changelog.zh-CN.md)

## 2026-03-08
- Rewrote the project from Python `aiohttp` to Cloudflare Workers + TypeScript.
- Added `wrangler.toml`, `package.json`, and `tsconfig.json` to establish the Workers toolchain.
- Introduced modular source code under `src/` for configuration, GitHub validation, formatting, and Telegram delivery.
- Added a `test/` directory with coverage for config parsing, webhook validation, formatting, Telegram delivery, and the Worker entrypoint.
- Expanded project documentation for usage, deployment, migration, and architecture.
- Replaced the legacy Python GitHub Actions flow with a Node.js build-and-test workflow.
- Upgraded dependencies to current stable npm versions and raised the minimum Node.js version to 24+.
- Added CI artifact uploads for Worker bundle output.

