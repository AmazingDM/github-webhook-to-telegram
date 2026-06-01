# Deployment Overview

> Simplified Chinese: [deployment.zh-CN.md](deployment.zh-CN.md)

This guide is written for fork users. You do not need to change code or manually create the Worker in Cloudflare. Add the required GitHub Actions secrets, then either run the deploy workflow manually or push a Git tag.

## What You Get
After setup, you will have:
- a Cloudflare Worker URL for GitHub Webhook `Payload URL`;
- a Telegram bot that receives GitHub event messages;
- a GitHub Actions release flow where normal commits only run checks, and manual deploy runs or tag pushes publish.
- a daily fork sync workflow that keeps unchanged forks close to upstream.

## 1. Fork The Repository
1. Open the upstream repository.
2. Click `Fork`.
3. Open your own fork.

All following settings are done in your fork.

If GitHub asks you to enable Actions in the fork, enable them before continuing.

## 2. Prepare Telegram
1. Open [BotFather](https://t.me/BotFather) and send `/newbot`.
2. Save the token returned by BotFather. This is `BOT_TOKEN`.
3. Add the bot to the chat, group, or channel that should receive messages.
4. Prepare the target chat ID:
   - private chats and groups usually use numeric IDs such as `-1001234567890`;
   - public channels may use `@channel_name`.

## 3. Prepare Cloudflare
1. Log in to Cloudflare.
2. Find your Account ID.
3. Open `My Profile -> API Tokens -> Create Token`.
4. Create an API token that can deploy Workers.

Recommended permissions:
- Account: `Account Settings` read
- Account: `Workers Scripts` edit

If Cloudflare offers a Workers-related token template in your account, you can start from that template and confirm it can edit Workers in the target account.

## 4. Write `HOOK_CONFIG_JSON`
`HOOK_CONFIG_JSON` tells the Worker which GitHub repository or organization should send messages to which Telegram target, and which webhook secret to use for signature verification.

Single repository:

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

Organization-level route:

```json
{"gh_webhooks":{"your-org":{"chat_id":"@your_channel","secret":"replace-with-random-secret"}}}
```

Rules:
- The key may be a repository full name, such as `your-name/your-repo`.
- The key may be an organization name, such as `your-org`.
- If both organization and repository match, the organization route wins.
- `secret` must exactly match the GitHub Webhook `Secret`.
- Store it as one JSON line in GitHub Secrets. Do not add comments.

## 5. Add GitHub Actions Secrets
Open your fork:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Add these 4 secrets:

| Secret | Example | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | `***` | Cloudflare API token that can deploy Workers |
| `CLOUDFLARE_ACCOUNT_ID` | `0123456789abcdef...` | Cloudflare Account ID |
| `BOT_TOKEN` | `123456:ABC...` | Telegram bot token |
| `HOOK_CONFIG_JSON` | `{"gh_webhooks":{...}}` | one-line routing JSON |

Never commit these values to the repository.

## 6. Confirm Worker Name
The default Worker name is in [../wrangler.toml](../wrangler.toml):

```toml
name = "github-webhook-to-telegram"
```

If you want another name, edit `name` and commit it to your fork.

## 7. Trigger Deployment
Normal pushes only run checks. You can deploy in two ways.

### Option A: Manual Release
1. Open `Actions` in your fork.
2. Select `Cloudflare Worker Deploy`.
3. Click `Run workflow`.
4. Choose the branch to deploy, usually `main`.
5. Click `Run workflow` again.

### Option B: Automatic Tag Release
Push a Git tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then open:

`Actions -> Cloudflare Worker Deploy`

Wait for the workflow to finish. It deploys the Worker to Cloudflare and syncs `BOT_TOKEN` and `HOOK_CONFIG_JSON` as Worker secrets.

## 8. Configure GitHub Webhook
After deployment, add a webhook to the repository or organization you want to watch:

`Settings -> Webhooks -> Add webhook`

Use:

```text
Payload URL: https://<worker-name>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: replace-with-random-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

`Secret` must match the selected `secret` in `HOOK_CONFIG_JSON`.

## 9. Verify
1. Open the latest `ping` delivery in the GitHub Webhook page.
2. Confirm the response is successful.
3. Open Telegram and confirm the message arrived.
4. If not, start with the troubleshooting section in [deployment-worker-auto.md](deployment-worker-auto.md).

## 10. Keep The Fork Updated
The `Sync Upstream` workflow runs daily and can also be started manually from `Actions -> Sync Upstream -> Run workflow`.

It only fast-forwards your fork's `main` branch to `AmazingDM/github-webhook-to-telegram`. If your fork has local commits that are not in upstream, the workflow fails with a clear message and does not force push.

If the workflow cannot push, open `Settings -> Actions -> General -> Workflow permissions` in your fork and enable `Read and write permissions`.

## Automation Rules
| Event | Result |
| --- | --- |
| Branch push | install, type check, build, test |
| Pull request | install, type check, build, test |
| Manual checks workflow | install, type check, build, test |
| Manual deploy workflow | install, type check, build, test, deploy Worker, sync Worker secrets |
| Git tag push | install, type check, build, test, deploy Worker, sync Worker secrets |
| Daily sync workflow | fast-forward fork `main` to upstream when safe |

## Next Docs
- [GitHub Actions Deployment](deployment-actions.md)
- [Cloudflare Worker Deployment](deployment-worker-auto.md)
- [Usage Guide](usage.md)
