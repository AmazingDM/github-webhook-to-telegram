# Cloudflare Worker Deployment Guide

> Simplified Chinese: [deployment-worker-auto.zh-CN.md](deployment-worker-auto.zh-CN.md)

This document focuses on the Worker side: Wrangler, Cloudflare runtime configuration, webhook callback values, and production troubleshooting.

## Scope
The project is deployed as a Cloudflare Worker with the following core files and commands:
- configuration: [wrangler.toml](../wrangler.toml)
- entrypoint: [src/index.ts](../src/index.ts)
- local development: `npm run dev`
- bundle validation: `npm run build`
- production deployment: `npm run deploy`
- automated release workflow: [`.github/workflows/cloudflare-worker-deploy.yml`](../.github/workflows/cloudflare-worker-deploy.yml)

## Prerequisites
Before deploying, prepare:

| Item | Required | Notes |
| --- | --- | --- |
| Cloudflare account | yes | hosts the Worker |
| Wrangler login or API token | yes | needed for manual or automated deployment |
| `BOT_TOKEN` | yes | Telegram bot token |
| `HOOK_CONFIG_JSON` | yes | repository / organization routing map |
| GitHub webhook secret | yes | must match the selected route secret |

## Confirm `wrangler.toml`
At minimum, confirm these fields in [wrangler.toml](../wrangler.toml):

```toml
name = "github-webhook-to-telegram"
main = "src/index.ts"
compatibility_date = "2026-03-08"
```

Verify before release:
- `name` matches your Worker naming convention
- `main` still points to the Worker entrypoint
- `compatibility_date` is intentionally pinned

## Runtime Variable Formats
The Worker reads only:
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

### Local `.dev.vars`
```dotenv
BOT_TOKEN=123456:replace-with-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

### Cloudflare Secret Values
`BOT_TOKEN`
```text
123456:replace-with-real-bot-token
```

`HOOK_CONFIG_JSON`
```json
{"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"},"your-org":{"chat_id":"@your_channel","secret":"replace-with-another-secret"}}}
```

Store `HOOK_CONFIG_JSON` as a single-line JSON string without comments or Markdown wrappers.

## GitHub Actions Secret Sync
The current automated deploy workflow syncs these values into the Worker after `npm run deploy`:
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

That means the GitHub Actions secrets must stay aligned with the production Worker configuration, and any secret change is only reflected after the sync step completes.

## Recommended `HOOK_CONFIG_JSON`
Readable form:
```json
{
  "gh_webhooks": {
    "your-org/your-repo": {
      "chat_id": -1001234567890,
      "secret": "replace-with-random-secret"
    },
    "your-org": {
      "chat_id": "@your_channel",
      "secret": "replace-with-another-secret"
    }
  }
}
```

Matching behavior:
- keys may be repository full names such as `your-org/your-repo`
- keys may be organization names such as `your-org`
- organization-level matches are evaluated before repository-level matches

## GitHub Webhook Form Values
After deployment, configure `Settings -> Webhooks -> Add webhook`:

```text
Payload URL: https://<your-worker>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: replace-with-random-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

## Recommended Rollout Sequence
1. Run `npm run build` locally.
2. Run one manual `npm run deploy` release.
3. Fill in GitHub webhook settings and verify an end-to-end delivery.
4. Use the deploy workflow for repeatable production releases after the manual flow is proven.

## Troubleshooting
### GitHub returns `403`
Check:
- the webhook `Secret` matches the selected route
- the repository or organization exists in `HOOK_CONFIG_JSON`
- `Content-Type` is `application/json`

### GitHub succeeds but Telegram is silent
Check:
- the bot has joined the target chat
- the bot can send messages there
- `BOT_TOKEN` is correct
- the event type is supported

### The Worker throws configuration errors
Check:
- `HOOK_CONFIG_JSON` is valid JSON
- the object includes `gh_webhooks`
- `chat_id` values are valid strings or numbers
- `secret` values are non-empty strings
