# Architecture Overview

> Simplified Chinese: [architecture.zh-CN.md](architecture.zh-CN.md)

## Purpose
This project runs on Cloudflare Workers and forwards relevant GitHub webhook events to Telegram chats.

## Request Flow
1. GitHub sends a webhook request to `POST /`.
2. The Worker validates `User-Agent`, `Content-Type`, and `X-Hub-Signature-256`.
3. The Worker matches the target route from `HOOK_CONFIG_JSON`.
4. The formatter registry renders supported GitHub events into Telegram HTML messages.
5. The Worker calls the Telegram Bot API `sendMessage` endpoint.
6. The Worker returns a plain-text result for webhook delivery diagnostics.

## Module Boundaries
- `src/index.ts`: HTTP entrypoint and response orchestration
- `src/config.ts`: runtime configuration parsing and route resolution
- `src/github.ts`: GitHub request validation and HMAC SHA-256 signature checks
- `src/formatters/`: event-specific message templates plus shared formatting helpers
- `src/telegram.ts`: Telegram Bot API transport layer

## Configuration Model
- `BOT_TOKEN`: Telegram bot token
- `HOOK_CONFIG_JSON`: a single JSON string containing the `gh_webhooks` mapping
- `gh_webhooks` keys may be repository full names or organization names

## Design Trade-Offs
- Keep a single JSON configuration model for compatibility with the legacy `config.json` flow.
- Keep Telegram `parse_mode=HTML` to preserve rich message formatting with minimal transport complexity.
- Avoid additional infrastructure such as KV, D1, or an admin panel so the project remains focused on webhook forwarding.
