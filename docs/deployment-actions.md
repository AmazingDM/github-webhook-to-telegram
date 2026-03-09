# GitHub Actions Deployment Guide

> Simplified Chinese: [deployment-actions.zh-CN.md](deployment-actions.zh-CN.md)

This document covers GitHub-side automation only: the checks workflow, the deploy workflow, repository secrets, and release rules.

## Workflow Files
The repository uses two workflow files:

| Workflow file | Purpose | Triggers |
| --- | --- | --- |
| [`.github/workflows/cloudflare-worker-checks.yml`](../.github/workflows/cloudflare-worker-checks.yml) | install dependencies, type check, build, test, upload `dist/` | `push`, `pull_request`, `workflow_dispatch` |
| [`.github/workflows/cloudflare-worker-deploy.yml`](../.github/workflows/cloudflare-worker-deploy.yml) | validate, sync Worker secrets, deploy to Cloudflare | `push` on `main`, `workflow_dispatch` |

## Checks Workflow
The checks workflow is the repository CI path. It is responsible for:
- dependency installation with `npm ci`
- `npm run typecheck`
- `npm run build`
- `npm test`
- artifact upload for `dist/`

This workflow must stay release-free so pull requests and normal pushes never publish to production.

## Deploy Workflow
The deploy workflow is the release path. It:
- runs on `main` pushes and manual dispatches
- repeats type check, build, and test before deployment
- syncs `BOT_TOKEN` and `HOOK_CONFIG_JSON` to Cloudflare with `wrangler secret put`
- publishes the Worker with `npm run deploy`

## Required GitHub Secrets
Open `Settings -> Secrets and variables -> Actions` and define:

| Secret | Required | Purpose | Format |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | yes | Cloudflare API authentication for deployment | single-line string |
| `CLOUDFLARE_ACCOUNT_ID` | yes | Cloudflare account selection | single-line string |
| `BOT_TOKEN` | yes | synced into Worker runtime before deploy | Telegram token string |
| `HOOK_CONFIG_JSON` | yes | synced into Worker runtime before deploy | single-line JSON string |

Template:
```dotenv
CLOUDFLARE_API_TOKEN=replace-with-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=replace-with-cloudflare-account-id
BOT_TOKEN=123456:replace-with-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

## Release Rules
Keep these rules fixed unless the release model changes intentionally:
- only the deploy workflow can publish to Cloudflare
- only `main` pushes and manual dispatches can trigger deployment
- deployment must pass type check, build, and test in the same workflow run
- secrets must stay in GitHub Actions and Cloudflare secret stores, not in tracked files

## Notes
- Keep `HOOK_CONFIG_JSON` on one line in GitHub secrets to avoid shell and YAML surprises.
- Use the GitHub checks workflow for validation, not as a hidden deploy path.
- Complete at least one manual deployment and webhook verification before relying on automated deploys.
