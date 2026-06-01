# Changelog

> Simplified Chinese: [changelog.zh-CN.md](changelog.zh-CN.md)

## Current Version
- Recommended deployment is fork + GitHub Actions secrets + manual release or tag release.
- Normal commits only run checks. Manual deploy workflow runs or Git tag pushes deploy to Cloudflare Worker.
- Forks can use the daily `Sync Upstream` workflow to fast-forward to upstream when safe.
- `BOT_TOKEN` and `HOOK_CONFIG_JSON` are synced as Worker secrets by the deploy workflow.
- The toolchain uses pnpm, Node.js 24, TypeScript, Vitest, and Wrangler.

## Initial Workers Version
- Rewrote the Python `aiohttp` service as Cloudflare Workers + TypeScript.
- Split configuration parsing, GitHub validation, message formatting, and Telegram delivery.
- Added test coverage for configuration, signature validation, message formatting, Telegram calls, and Worker responses.
- Added English and Simplified Chinese documentation.
