# Migration Guide: Python to Workers

> Simplified Chinese: [migration.zh-CN.md](migration.zh-CN.md)

## Migration Goal
The legacy version was based on Python `aiohttp` and deployed in a Heroku-oriented model. The new version targets Cloudflare Workers for a lighter serverless deployment experience.

## Key Mapping
- `main.py` -> `src/index.ts`
  Handles HTTP entrypoint logic and request dispatching.
- `config.py` -> `src/config.ts`
  Parses configuration from runtime environment variables instead of local files.
- `utils/github_webhook.py` -> `src/github.ts` + `src/formatters/`
  Separates validation logic from message rendering for better testability.
- `utils/telegram.py` -> `src/telegram.ts`
  Uses the Worker-native `fetch` API to call Telegram.

## Configuration Changes
The legacy version used local `config.json` or the Heroku `HOOK_CONFIG` environment variable.

The Workers version standardizes on:
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

## Deployment Changes
The legacy version depended on `Procfile`, `runtime.txt`, and `requirements.txt`.

The Workers version depends on `wrangler.toml` and the Node.js toolchain.

## Testing Changes
The legacy version only ran Python linting in GitHub Actions.

The Workers version adds Vitest-based unit tests covering configuration parsing, signature validation, notification rendering, Telegram delivery, and the Worker entrypoint.
