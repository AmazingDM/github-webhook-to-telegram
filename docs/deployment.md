# Deployment Overview

> Simplified Chinese: [deployment.zh-CN.md](deployment.zh-CN.md)

This repository separates automation into two GitHub Actions workflows plus the Worker runtime setup guide:

- [GitHub Actions Deployment Guide](deployment-actions.md)
  Covers the checks workflow, the deploy workflow, required GitHub secrets, and release expectations.
- [Cloudflare Worker Deployment Guide](deployment-worker-auto.md)
  Covers Worker runtime configuration, Wrangler, Worker secrets, and GitHub webhook values.

## Current Automation Layout
The repository includes two workflows:

| Workflow file | Purpose | Triggers |
| --- | --- | --- |
| [`.github/workflows/cloudflare-worker-checks.yml`](../.github/workflows/cloudflare-worker-checks.yml) | install, type check, build, test, upload `dist/` | `push`, `pull_request`, `workflow_dispatch` |
| [`.github/workflows/cloudflare-worker-deploy.yml`](../.github/workflows/cloudflare-worker-deploy.yml) | validate, deploy to Cloudflare, then sync Worker secrets | `push` on `main`, `workflow_dispatch` |

## Required Deployment Inputs
| Item | Purpose | Stored In | Format |
| --- | --- | --- | --- |
| `BOT_TOKEN` | Telegram message delivery | GitHub Actions secret and Cloudflare Worker secret | single-line string |
| `HOOK_CONFIG_JSON` | repository or organization routing | GitHub Actions secret and Cloudflare Worker secret | single-line JSON string |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions deployment auth | GitHub Actions secret | single-line string |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions deployment target | GitHub Actions secret | single-line string |
| Worker URL | GitHub webhook `Payload URL` | GitHub webhook settings | full HTTPS URL |
| Webhook secret | request signature verification | GitHub webhook settings | must match the target `secret` in `HOOK_CONFIG_JSON` |

Use the detailed guides for templates and step-by-step procedures:
- [GitHub Actions Deployment Guide](deployment-actions.md) for repository secrets, CI, and release rules
- [Cloudflare Worker Deployment Guide](deployment-worker-auto.md) for Worker secrets, `HOOK_CONFIG_JSON`, webhook form values, and rollout checks

## Important Notes
- The checks workflow is CI only. It must not perform deployment.
- The deploy workflow re-runs type check, build, and test before release; deployment does not bypass validation.
- The current deploy workflow runs `npm run deploy` first, then syncs `BOT_TOKEN` and `HOOK_CONFIG_JSON` with `wrangler secret put`.
- The GitHub webhook `Secret` must exactly match the selected `HOOK_CONFIG_JSON.gh_webhooks[*].secret` value.
- The current implementation matches `organization.login` before `repository.full_name`; organization-level configuration wins when both exist.
