# Usage Guide

> Simplified Chinese: [usage.zh-CN.md](usage.zh-CN.md)

This guide follows the typical setup order for the project: Telegram bot, webhook routing, local validation, and production verification.

## 1. Create a Telegram Bot
1. Open [BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Follow the prompts to choose a bot name and username.
4. Save the token returned by BotFather. This is your `BOT_TOKEN`.

## 2. Identify the Target `chat_id`
### Private chat
1. Open the bot in Telegram.
2. Click `Start`.
3. Use a Telegram API helper or another tool to look up the private `chat_id`.

### Group or channel
1. Add the bot to the group or channel.
2. Grant the bot permission to send messages.
3. Record the group or channel `chat_id`.
4. Public channel usernames such as `@channel_name` are also supported.

## 3. Write `HOOK_CONFIG_JSON`
`HOOK_CONFIG_JSON` declares which repository or organization should send notifications to which Telegram destination, and which secret GitHub must use.

Example:
```json
{
  "gh_webhooks": {
    "your-org/your-repo": {
      "chat_id": -1001234567890,
      "secret": "replace-with-a-random-secret"
    },
    "your-org": {
      "chat_id": "@your_channel",
      "secret": "replace-with-another-secret"
    }
  }
}
```

Notes:
- keys can be repository full names such as `your-org/your-repo`
- keys can also be organization names such as `your-org`
- if both repository and organization match, the current implementation prefers the organization-level configuration
- the `secret` value must exactly match the GitHub webhook form value

## 4. Run Locally
### Install dependencies
```bash
npm install
```

### Prepare local environment variables
1. Copy `.dev.vars.example` to `.dev.vars`
2. Replace `BOT_TOKEN`
3. Replace `HOOK_CONFIG_JSON` with your own values

Example:
```dotenv
BOT_TOKEN=123456:your-real-bot-token
HOOK_CONFIG_JSON={"gh_webhooks":{"your-org/your-repo":{"chat_id":-1001234567890,"secret":"replace-with-a-random-secret"}}}
```

### Start the local Worker
```bash
npm run dev
```

Wrangler starts a local development server and prints the local URL, usually `http://127.0.0.1:8787/`.

## 5. Validate Locally
### Run automated tests
```bash
npm test
```

### Run type checking
```bash
npm run typecheck
```

### Run bundle validation
```bash
npm run build
```

On success:
- `dist/` contains the bundled Worker output
- `dist/bundle-meta.json` records bundle metadata

## 6. Configure the GitHub Webhook
Open `Settings -> Webhooks -> Add webhook` on the target repository or organization, then fill in:
- `Payload URL`: your Worker URL, for example `https://your-worker.workers.dev/`
- `Content type`: `application/json`
- `Secret`: must match the selected route in `HOOK_CONFIG_JSON`
- `Which events would you like to trigger this webhook?`
  Start with `Send me everything`, then narrow it after validation if needed.

Supported events:
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

## 7. Verify Production Delivery
1. Open the latest delivery in the GitHub webhook page.
2. Confirm GitHub reports a successful response.
3. Open the target Telegram chat and confirm the bot message arrived.
4. If GitHub returns `403`, check:
   - whether the secret matches
   - whether `Content type` is `application/json`
   - whether the repository or organization exists in `HOOK_CONFIG_JSON`
5. If GitHub succeeds but Telegram is silent, check:
   - whether the bot has joined the target chat
   - whether the bot can speak there
   - whether `BOT_TOKEN` is correct

## 8. Common Issues
### `403: Forbidden`
Usually caused by:
- failed `X-Hub-Signature-256` validation
- missing repository or organization route
- headers that do not match GitHub webhook expectations

### Worker deploys but no Telegram message arrives
- verify Cloudflare runtime variables are present
- verify the Telegram bot can send to the target `chat_id`
- verify the triggered event is in the supported list

### Special characters break message rendering
The project already escapes HTML-sensitive characters. If you add new formatting logic, continue to reuse `escapeHtml()`.
