# GitHub Actions Deployment

> Simplified Chinese: [deployment-actions.zh-CN.md](deployment-actions.zh-CN.md)

This page only covers GitHub-side setup. As a fork user, the key task is to add 4 repository secrets, then either run the deploy workflow manually or push a tag.

## Workflows
| File | Trigger | What it does |
| --- | --- | --- |
| [../.github/workflows/cloudflare-worker-checks.yml](../.github/workflows/cloudflare-worker-checks.yml) | branch push, pull request, manual run | install, type check, build, test |
| [../.github/workflows/cloudflare-worker-deploy.yml](../.github/workflows/cloudflare-worker-deploy.yml) | manual run, Git tag push | check, deploy Worker, sync Worker secrets |
| [../.github/workflows/sync-upstream.yml](../.github/workflows/sync-upstream.yml) | daily schedule, manual run | fast-forward fork `main` to upstream when safe |

## Required Secrets
Open your fork:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Add:

| Secret | Source | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Tokens page | deploys the Worker with `wrangler deploy`; recommended permissions are `Account Settings` read and `Workers Scripts` edit |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account home | selects the target account |
| `BOT_TOKEN` | Telegram BotFather | lets the Worker call Telegram Bot API |
| `HOOK_CONFIG_JSON` | written by you | routes GitHub repositories or organizations to Telegram chats |

Example `HOOK_CONFIG_JSON`:

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

## Release
The deploy workflow does not run on normal commits. You can release manually or with a tag.

### Manual Release
1. Open `Actions` in your fork.
2. Select `Cloudflare Worker Deploy`.
3. Click `Run workflow`.
4. Choose the branch to deploy, usually `main`.
5. Confirm the workflow run.

### Automatic Tag Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

To deploy again, prefer a new tag instead of reusing the old one:

```bash
git tag v1.0.1
git push origin v1.0.1
```

## Keep A Fork Updated
The `Sync Upstream` workflow is for fork users who want to receive upstream fixes without manually pulling them.

It runs once per day and can also be started from:

`Actions -> Sync Upstream -> Run workflow`

Behavior:
- it does nothing in the upstream repository;
- it fetches `AmazingDM/github-webhook-to-telegram`;
- it fast-forwards your fork's `main` branch when your fork has no local-only commits;
- it refuses to force push if your fork has diverged.

If the push step returns `403`, open `Settings -> Actions -> General -> Workflow permissions` in the fork and enable `Read and write permissions`.

## Deploy Workflow Order
The deploy workflow runs:
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm build`
4. `pnpm test`
5. `pnpm run deploy`
6. `wrangler secret put BOT_TOKEN`
7. `wrangler secret put HOOK_CONFIG_JSON`

Any failed step stops the deployment.

## Common Errors
### `ERR_PNPM_OUTDATED_LOCKFILE`
`package.json` and `pnpm-lock.yaml` are out of sync. Fix with:

```bash
pnpm install --lockfile-only
```

Then commit the updated `pnpm-lock.yaml`.

### `ERR_PNPM_CANNOT_DEPLOY`
The command was written as `pnpm deploy`. The correct command is:

```bash
pnpm run deploy
```

### Cloudflare authentication fails
Check:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- whether the API token can publish Workers

### Sync workflow refuses to update
Your fork has commits that are not in upstream. Merge or rebase upstream manually, push the resolved `main`, then rerun `Sync Upstream`.

## Safety Rules
- Do not commit tokens into code, docs, or `.dev.vars`.
- Do not deploy production from normal branch pushes.
- Use the manual deploy workflow or tag pushes for releases.
- The upstream sync workflow only fast-forwards; it must not overwrite fork-specific commits.
