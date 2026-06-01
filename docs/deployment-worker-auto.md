# Cloudflare Worker Deployment

> Simplified Chinese: [deployment-worker-auto.zh-CN.md](deployment-worker-auto.zh-CN.md)

This page explains the Cloudflare side. The recommended flow is GitHub Actions deployment. You do not need to paste code manually in the Cloudflare dashboard.

## Key Files
| File | Purpose |
| --- | --- |
| [../wrangler.toml](../wrangler.toml) | Worker name, entrypoint, compatibility date |
| [../.node-version](../.node-version) | Node.js major version for GitHub/Cloudflare builds |
| [../src/index.ts](../src/index.ts) | Worker entrypoint |
| [../.github/workflows/cloudflare-worker-deploy.yml](../.github/workflows/cloudflare-worker-deploy.yml) | manual release and automatic tag release workflow |
| [../.github/workflows/sync-upstream.yml](../.github/workflows/sync-upstream.yml) | daily safe upstream sync for forks |

## `wrangler.toml`
Default configuration:

```toml
name = "github-webhook-to-telegram"
main = "src/index.ts"
compatibility_date = "2026-03-08"
```

After forking, you usually only need to decide whether to change `name`. If you keep the default, the Worker URL includes `github-webhook-to-telegram`.

## Worker Secrets
After `pnpm run deploy` succeeds, the deploy workflow syncs two Worker secrets:
- `BOT_TOKEN`
- `HOOK_CONFIG_JSON`

You do not need to create them manually in the Cloudflare dashboard. They come from GitHub Actions secrets in your fork.

## Webhook URL
After deployment, the Cloudflare Worker URL usually looks like:

```text
https://<worker-name>.<your-subdomain>.workers.dev/
```

Use this as the GitHub Webhook `Payload URL`.

## GitHub Webhook Values
In the target repository or organization, open:

`Settings -> Webhooks -> Add webhook`

Use:

```text
Payload URL: https://<worker-name>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: replace-with-random-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

`Secret` must match the selected route `secret` in `HOOK_CONFIG_JSON`.

## Recommended Rollout
1. Fork the repository.
2. Add GitHub Actions secrets.
3. Run `Cloudflare Worker Deploy` manually, or push a tag to deploy.
4. Wait for the `Cloudflare Worker Deploy` workflow to succeed.
5. Copy the Worker URL.
6. Add the GitHub Webhook.
7. Verify with the `ping` delivery in the Webhook page.

Upstream sync does not deploy by itself. After a sync, normal branch pushes only run checks; deploy again manually or with a new tag when you want production updated.

## Troubleshooting
### GitHub Actions deployment fails
Start from the failed step:
- install failed: check whether `pnpm-lock.yaml` matches `package.json`;
- typecheck/test/build failed: fix code or dependency errors from the log;
- deploy failed: check Cloudflare API token and Account ID;
- secret sync failed: check Cloudflare API token permissions.

### GitHub Webhook returns `403`
Check:
- Webhook `Secret` equals the selected `secret` in `HOOK_CONFIG_JSON`;
- Webhook `Content type` is `application/json`;
- `HOOK_CONFIG_JSON` includes the target repository full name or organization name.

### GitHub Webhook succeeds but Telegram is silent
Check:
- the bot has joined the target chat;
- the bot can send messages there;
- `BOT_TOKEN` belongs to the correct bot;
- the event type is supported.

### Secrets changed but production did not change
Changing GitHub Actions secrets does not automatically update the Worker. Run the deploy workflow manually, or push a new tag, so the workflow syncs the new values to Cloudflare Worker.
