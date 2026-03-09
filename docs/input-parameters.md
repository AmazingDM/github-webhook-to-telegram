# Input Parameters Reference

> Simplified Chinese: [input-parameters.zh-CN.md](input-parameters.zh-CN.md)

This document lists the primary inputs consumed by the Worker implementation, including:
- runtime environment variables injected by Wrangler / Cloudflare Workers
- GitHub webhook HTTP headers
- GitHub webhook JSON payload fields

The reference reflects the current implementation and runtime entrypoint in `src/index.ts`.

## 1. Runtime Environment Variables
The Worker reads the following runtime variables:

| Variable | Type | Required | Description |
| --- | --- | --- | --- |
| `BOT_TOKEN` | `string` | yes | Telegram bot token used to call the Telegram Bot API. Missing values cause request handling to fail fast. |
| `HOOK_CONFIG_JSON` | `string` | yes | GitHub webhook routing configuration. Must be a valid JSON string. Missing or invalid values cause request handling to fail fast. |

### 1.1 `HOOK_CONFIG_JSON` structure
```json
{
  "gh_webhooks": {
    "Codertocat/Hello-World": {
      "chat_id": -1001234567890,
      "secret": "FPAh9pwRHCLpRL7j"
    },
    "octo-org": {
      "chat_id": "@username",
      "secret": "KLrYeiA3vNLPVbAv"
    }
  }
}
```

### 1.2 `gh_webhooks` fields
| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `gh_webhooks` | `Record<string, HookTarget>` | yes | mapping from repositories or organizations to Telegram targets |
| `gh_webhooks.<key>` | `object` | yes | a single route definition; `key` may be a repository full name or an organization name |
| `gh_webhooks.<key>.chat_id` | `string \| number` | yes | Telegram target chat ID, either a numeric ID or a public `@channel_name` |
| `gh_webhooks.<key>.secret` | `string` | yes | GitHub webhook secret used to validate `X-Hub-Signature-256` |

### 1.3 Route matching order
The project matches `HOOK_CONFIG_JSON` targets in this order:
1. `payload.organization.login`
2. `payload.repository.full_name`

If both organization and repository keys exist and both match, the organization-level route wins.

## 2. Webhook Request Entry Conditions
| Item | Fixed value / rule | Description |
| --- | --- | --- |
| Request path | `POST /` | Only the root path with method `POST` enters business logic. |
| Non-root paths | `404` | For example, `POST /foo` is rejected. |
| Non-`POST` methods | `405` | For example, `GET /` is rejected. |

## 3. GitHub Webhook Headers
The following headers are explicitly read or validated:

| Header | Required | Rule | Description |
| --- | --- | --- | --- |
| `User-Agent` | yes | must start with `GitHub-Hookshot` | quick validation that the request looks like GitHub |
| `Content-Type` | yes | must start with `application/json` | only JSON payloads are accepted |
| `X-Hub-Signature-256` | yes | must be formatted as `sha256=<hex>` | used for HMAC SHA-256 verification |
| `X-GitHub-Event` | optional but strongly recommended | any string | selects the formatter for the incoming event; unsupported events are ignored rather than treated as failures |

### 3.1 `X-Hub-Signature-256`
Signature handling follows the GitHub convention:
- the raw request body text is part of the HMAC SHA-256 calculation
- the signing key comes from the matched `gh_webhooks.<key>.secret`
- the implementation compares the hexadecimal digest after the `sha256=` prefix

If the signature is missing, malformed, or invalid, the service returns `403 Forbidden`.

## 4. GitHub Webhook JSON Payload
The request body must be valid JSON. The project does not depend on the entire GitHub payload schema; it only reads the minimum fields required by the current implementation.

## 5. Common Payload Fields
| Field path | Type | Required when | Description |
| --- | --- | --- | --- |
| `action` | `string` | conditionally required | present on action-style events such as `opened`, `created`, or `deleted` |
| `sender.login` | `string` | effectively required | displayed as the actor in notification headers |
| `repository.full_name` | `string` | conditionally required | used for route matching and repository display |
| `repository.html_url` | `string` | conditionally required | used to build repository links |
| `repository.stargazers_count` | `number` | conditionally required | used by `star` and `fork` messages |
| `repository.forks_count` | `number` | conditionally required | used by `star` and `fork` messages |
| `organization.login` | `string` | optional | used for organization-level route matching and fallback display |
| `number` | `number` | conditionally required | used by `issues`, `pull_request`, and `discussion` notifications |
| `ref` | `string` | conditionally required | used by `create`, `delete`, and `push` |
| `ref_type` | `string` | conditionally required | used by `create` and `delete`, for example `branch` or `tag` |

## 6. Event-Specific Fields
### 6.1 `create`
| Field path | Type | Description |
| --- | --- | --- |
| `ref_type` | `string` | type of reference created |
| `ref` | `string` | branch or tag name |
| `repository.html_url` | `string` | used to build the reference link |

### 6.2 `delete`
| Field path | Type | Description |
| --- | --- | --- |
| `ref_type` | `string` | type of reference deleted |
| `ref` | `string` | branch or tag name |

### 6.3 `discussion`
| Field path | Type | Description |
| --- | --- | --- |
| `discussion.html_url` | `string` | discussion page URL |
| `discussion.title` | `string` | discussion title |
| `discussion.number` | `number` | discussion number |

### 6.4 `fork`
| Field path | Type | Description |
| --- | --- | --- |
| `forkee.html_url` | `string` | new fork URL |
| `forkee.full_name` | `string` | new fork full name |
| `repository.stargazers_count` | `number` | source repository star count |
| `repository.forks_count` | `number` | source repository fork count |

### 6.5 `issues`
| Field path | Type | Description |
| --- | --- | --- |
| `issue.html_url` | `string` | issue URL |
| `issue.title` | `string` | issue title |
| `issue.number` | `number` | issue number |

### 6.6 `ping`
`ping` only depends on the common header fields and emits a reachability confirmation message.

### 6.7 `public`
| Field path | Type | Description |
| --- | --- | --- |
| `repository.html_url` | `string` | repository URL |
| `repository.full_name` | `string` | repository full name |

### 6.8 `pull_request`
| Field path | Type | Description |
| --- | --- | --- |
| `pull_request.html_url` | `string` | pull request URL |
| `pull_request.title` | `string` | pull request title |
| `pull_request.user.login` | `string` | pull request author |
| `number` | `number` | pull request number |

### 6.9 `push`
| Field path | Type | Description |
| --- | --- | --- |
| `ref` | `string` | pushed Git reference |
| `commits` | `Array<object>` | commit list |
| `commits[].id` | `string` | commit SHA, shortened to 7 characters in messages |
| `commits[].message` | `string` | commit message |
| `commits[].url` | `string` | commit URL |
| `commits[].author.username` | `string` | preferred author username |
| `commits[].author.name` | `string` | fallback author name |

### 6.10 `star`
| Field path | Type | Description |
| --- | --- | --- |
| `repository.stargazers_count` | `number` | current star count |
| `repository.forks_count` | `number` | current fork count |

## 7. Supported Event Types
The current implementation supports these `X-GitHub-Event` values:
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

If an event type is not in this list:
- request validation may still succeed
- no Telegram message will be sent
- the response will be `Send to Telegram: nothing to send`

## 8. Source Locations
| Parameter category | Primary code location |
| --- | --- |
| runtime variable parsing | `src/config.ts` |
| request path and method checks | `src/index.ts` |
| header and signature validation | `src/github.ts` |
| payload type definitions | `src/types.ts` |
| event-specific rendering | `src/formatters/` |

## 9. Maintenance Notes
When you add new event types or runtime variables, update the following together:
1. `src/types.ts`
2. `src/formatters/`
3. `docs/input-parameters.md`
4. `README.md`
