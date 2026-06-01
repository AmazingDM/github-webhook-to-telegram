# Usage Guide

> Simplified Chinese: [usage.zh-CN.md](usage.zh-CN.md)

This guide explains the runtime configuration: Telegram, `HOOK_CONFIG_JSON`, and GitHub Webhook values. For deployment, see [deployment.md](deployment.md).

## 1. Telegram Bot
1. Open [BotFather](https://t.me/BotFather) in Telegram.
2. Send `/newbot`.
3. Save the returned token as `BOT_TOKEN`.
4. Add the bot to the target private chat, group, or channel.
5. Confirm the bot can send messages.

`chat_id` may be:
- a numeric ID, such as `-1001234567890`;
- a public channel username, such as `@channel_name`.

## 2. `HOOK_CONFIG_JSON`
Minimal configuration:

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-random-secret"}}}
```

Multiple routes:

```json
{
  "gh_webhooks": {
    "your-name/your-repo": {
      "chat_id": -1001234567890,
      "secret": "repo-secret"
    },
    "your-org": {
      "chat_id": "@your_channel",
      "secret": "org-secret"
    }
  }
}
```

When saving it as a GitHub secret, keep it on one line:

```json
{"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"repo-secret"},"your-org":{"chat_id":"@your_channel","secret":"org-secret"}}}
```

Matching order:
1. `organization.login`
2. `repository.full_name`

Organization routes override repository routes.

## 3. Webhook Secret
`secret` is not the Telegram token. It verifies GitHub Webhook signatures.

GitHub signs the raw request body with the `Secret` from the Webhook page and sends the result in `X-Hub-Signature-256`. The Worker recalculates the signature with the matched `secret` from `HOOK_CONFIG_JSON`.

If the values do not match, the Worker returns `403`.

## 4. GitHub Webhook
In the target repository or organization, open:

`Settings -> Webhooks -> Add webhook`

Use:

```text
Payload URL: https://<worker-name>.<your-subdomain>.workers.dev/
Content type: application/json
Secret: repo-secret
Which events would you like to trigger this webhook?: Send me everything
Active: checked
```

Start with `Send me everything`. After the end-to-end path works, reduce the event list if needed.

## 5. Supported Events
Events that produce Telegram messages:
- `create`
- `delete`
- `discussion`
- `fork`
- `issues`
- `ping`
- `public`
- `pull_request`
- `push`
- `star`

Unsupported events do not fail the request. They return no message to send.

## 6. Local Verification
Local checks are optional for fork-based deployment.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Run locally:

```bash
cp .dev.vars.example .dev.vars
pnpm dev
```

Example `.dev.vars`:

```dotenv
BOT_TOKEN=123456:your-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-name/your-repo":{"chat_id":-1001234567890,"secret":"repo-secret"}}}
```

Do not commit `.dev.vars`.

## 7. Verify Notifications
1. Open the latest delivery in the GitHub Webhook page.
2. Confirm the HTTP status is successful.
3. Open Telegram and confirm the message arrived.

Common issues:
- `403`: mismatched secret, unmatched repository, or non-JSON content type.
- GitHub succeeds but Telegram is silent: bot permissions, wrong `BOT_TOKEN`, or unsupported event.
- GitHub secrets changed but production did not: run the deploy workflow manually, or push a new tag to redeploy.
