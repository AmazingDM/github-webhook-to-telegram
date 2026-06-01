# GitHub Webhook to Telegram

> Simplified Chinese: [README.zh-CN.md](README.zh-CN.md)

This Cloudflare Workers service receives GitHub webhooks, verifies their signatures, and forwards supported events to Telegram.

The recommended path is: fork this repository, add the required GitHub Actions secrets, then deploy to Cloudflare Worker either by manually running the workflow or by pushing a Git tag.

## Quick Deployment
1. Fork this repository to your GitHub account.
2. Create a Telegram bot and add it to the target chat.
3. Prepare a Cloudflare API token and Account ID.
4. In your fork, open `Settings -> Secrets and variables -> Actions -> New repository secret`.
5. Add these 4 secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token used to deploy the Worker |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `BOT_TOKEN` | Telegram bot token |
| `HOOK_CONFIG_JSON` | Repository or organization routing JSON |

`HOOK_CONFIG_JSON` must be a single-line JSON string, for example:

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

6. If you want a different Worker name, edit `name` in [wrangler.toml](wrangler.toml).
7. Choose one release method:

Manual release: open `Actions -> Cloudflare Worker Deploy -> Run workflow`.

Automatic tag release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

8. After deployment, add a webhook to the GitHub repository or organization you want to watch:

```text
Payload URL: https://<your-worker>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: must match the selected secret in HOOK_CONFIG_JSON
Events: Send me everything
Active: checked
```

See [docs/deployment.md](docs/deployment.md) for the complete walkthrough.

## Local Checks
Local development is optional for deployment, but useful before changing the fork:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Run the Worker locally:

```bash
cp .dev.vars.example .dev.vars
pnpm dev
```

## Documentation
- [Deployment Overview](docs/deployment.md): complete fork-to-production path.
- [GitHub Actions Deployment](docs/deployment-actions.md): secrets, manual releases, tag releases, and workflow behavior.
- [Worker Configuration](docs/deployment-worker-auto.md): Cloudflare, Wrangler, webhook values, and troubleshooting.
- [Usage Guide](docs/usage.md): Telegram, `HOOK_CONFIG_JSON`, and webhook verification.
- [Changelog](docs/changelog.md): major project changes.

## Fork Updates
Forks include a daily `Sync Upstream` workflow. It fast-forwards your `main` branch to the upstream repository when there are no local fork-only commits. If your fork has diverged, the workflow stops instead of overwriting your changes; merge upstream manually, then rerun the workflow.

## Supported Events
`create`, `delete`, `discussion`, `fork`, `issues`, `ping`, `public`, `pull_request`, `push`, `star`

## License
AGPL-3.0-or-later. See [LICENSE](LICENSE).
