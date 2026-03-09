# 传入参数说明

本文档汇总项目运行时会接收的所有主要输入参数，包括：

- Wrangler / Cloudflare Workers 注入的环境变量
- GitHub Webhook HTTP 请求头
- GitHub Webhook JSON 请求体字段

文档内容以当前实现为准，源码入口见 `src/index.ts`。

## 1. 运行环境变量

Worker 启动后，会从运行时环境读取以下变量：

| 变量名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `BOT_TOKEN` | `string` | 是 | Telegram Bot Token，用于调用 Telegram Bot API。缺失时启动请求处理会直接报错。 |
| `HOOK_CONFIG_JSON` | `string` | 是 | GitHub Webhook 路由配置，必须是合法 JSON 字符串。缺失或结构非法时会直接报错。 |

### 1.1 `HOOK_CONFIG_JSON` 结构

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

### 1.2 `gh_webhooks` 子字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gh_webhooks` | `Record<string, HookTarget>` | 是 | 仓库或组织到 Telegram 目标的映射表。 |
| `gh_webhooks.<key>` | `object` | 是 | 单个路由配置。`key` 可以是 `仓库全名`，也可以是 `组织名`。 |
| `gh_webhooks.<key>.chat_id` | `string \| number` | 是 | Telegram 目标聊天 ID，支持数值 ID 或 `@channel_name`。 |
| `gh_webhooks.<key>.secret` | `string` | 是 | GitHub Webhook Secret，用于校验 `X-Hub-Signature-256`。 |

### 1.3 路由匹配规则

项目会按以下顺序匹配 `HOOK_CONFIG_JSON` 中的目标：

1. `payload.organization.login`
2. `payload.repository.full_name`

也就是说，如果组织名和仓库全名都存在，并且都在配置中命中，当前实现会优先使用组织级配置。

## 2. Webhook 请求入口

| 项目 | 固定值 / 要求 | 说明 |
| --- | --- | --- |
| 请求路径 | `POST /` | 只有根路径且方法为 `POST` 才会继续处理。 |
| 非根路径 | 返回 `404` | 例如 `POST /foo` 不会进入业务逻辑。 |
| 非 `POST` | 返回 `405` | 例如 `GET /` 会被拒绝。 |

## 3. GitHub Webhook 请求头

以下请求头会被显式读取或校验：

| 请求头 | 必填 | 规则 | 说明 |
| --- | --- | --- | --- |
| `User-Agent` | 是 | 必须以 `GitHub-Hookshot` 开头 | 用于初步识别请求是否来自 GitHub。 |
| `Content-Type` | 是 | 必须以 `application/json` 开头 | 当前实现只接受 JSON 负载。 |
| `X-Hub-Signature-256` | 是 | 格式应为 `sha256=<hex>` | 用于 HMAC SHA-256 签名校验。 |
| `X-GitHub-Event` | 否，但建议始终提供 | 任意字符串 | 用于决定使用哪个事件格式化器。未支持事件不会报错，但不会发送 Telegram 消息。 |

### 3.1 `X-Hub-Signature-256`

签名规则与 GitHub 官方一致：

- 原始请求体文本会参与 HMAC SHA-256 计算
- 密钥来自匹配到的 `gh_webhooks.<key>.secret`
- 项目会取 `sha256=` 后面的十六进制摘要参与比较

如果签名缺失、格式错误或校验失败，服务会返回 `403 Forbidden`。

## 4. GitHub Webhook JSON 请求体

请求体必须是合法 JSON。项目不会完整依赖 GitHub 的全部字段，而是只读取当前实现需要的最小字段集合。

## 5. 通用字段

以下字段会在多个事件中复用：

| 字段路径 | 类型 | 必填情况 | 说明 |
| --- | --- | --- | --- |
| `action` | `string` | 条件必填 | 某些 GitHub 事件会带上动作，例如 `opened`、`created`、`deleted`。 |
| `sender.login` | `string` | 实际上应视为必填 | 用于消息标题中的操作者显示。 |
| `repository.full_name` | `string` | 条件必填 | 用于仓库路由匹配和消息标题显示，例如 `owner/repo`。 |
| `repository.html_url` | `string` | 条件必填 | 某些事件会拼接为仓库链接。 |
| `repository.stargazers_count` | `number` | 条件必填 | `star`、`fork` 等事件会读取。 |
| `repository.forks_count` | `number` | 条件必填 | `star`、`fork` 等事件会读取。 |
| `organization.login` | `string` | 可选 | 用于组织级路由匹配，也可作为消息标题回退名称。 |
| `number` | `number` | 条件必填 | `issues`、`pull_request`、`discussion` 等编号型事件会读取。 |
| `ref` | `string` | 条件必填 | `create`、`delete`、`push` 事件会读取。 |
| `ref_type` | `string` | 条件必填 | `create`、`delete` 事件会读取，例如 `branch`、`tag`。 |

## 6. 事件专属字段

### 6.1 `create`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `ref_type` | `string` | 被创建的引用类型。 |
| `ref` | `string` | 被创建的分支名或标签名。 |
| `repository.html_url` | `string` | 用于拼接目标链接。 |

### 6.2 `delete`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `ref_type` | `string` | 被删除的引用类型。 |
| `ref` | `string` | 被删除的分支名或标签名。 |

### 6.3 `discussion`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `discussion.html_url` | `string` | Discussion 页面链接。 |
| `discussion.title` | `string` | Discussion 标题。 |
| `discussion.number` | `number` | Discussion 编号。 |

### 6.4 `fork`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `forkee.html_url` | `string` | 新 Fork 仓库链接。 |
| `forkee.full_name` | `string` | 新 Fork 仓库全名。 |
| `repository.stargazers_count` | `number` | 原仓库星标数。 |
| `repository.forks_count` | `number` | 原仓库 Fork 数。 |

### 6.5 `issues`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `issue.html_url` | `string` | Issue 页面链接。 |
| `issue.title` | `string` | Issue 标题。 |
| `issue.number` | `number` | Issue 编号。 |

### 6.6 `ping`

`ping` 事件只依赖通用标题字段，不读取额外详情字段。当前实现会生成标题，但不追加详情内容。

### 6.7 `public`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `repository.html_url` | `string` | 仓库链接。 |
| `repository.full_name` | `string` | 仓库全名。 |

### 6.8 `pull_request`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `pull_request.html_url` | `string` | Pull Request 链接。 |
| `pull_request.title` | `string` | Pull Request 标题。 |
| `pull_request.user.login` | `string` | Pull Request 作者。 |
| `number` | `number` | Pull Request 编号。 |

### 6.9 `push`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `ref` | `string` | 被推送的 Git 引用。 |
| `commits` | `Array<object>` | 提交列表。 |
| `commits[].id` | `string` | Commit SHA，消息里只截取前 7 位。 |
| `commits[].message` | `string` | Commit 信息。 |
| `commits[].url` | `string` | Commit 链接。 |
| `commits[].author.username` | `string` | 作者 GitHub 用户名，优先使用。 |
| `commits[].author.name` | `string` | 作者显示名，当 `username` 缺失时回退使用。 |

### 6.10 `star`

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `repository.stargazers_count` | `number` | 当前星标数。 |
| `repository.forks_count` | `number` | 当前 Fork 数。 |

## 7. 当前支持的事件类型

当前实现支持以下 `X-GitHub-Event` 值：

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

如果事件类型不在这个列表中：

- 请求仍可能通过签名校验
- 但不会发送 Telegram 消息
- 返回内容会是 `Send to Telegram: nothing to send`

## 8. 参数来源与代码位置

| 参数类别 | 主要代码位置 |
| --- | --- |
| 环境变量解析 | `src/config.ts` |
| 请求路径与方法校验 | `src/index.ts` |
| 请求头与签名校验 | `src/github.ts` |
| 请求体字段定义 | `src/types.ts` |
| 事件字段使用方式 | `src/formatters.ts` |

## 9. 维护建议

后续如果新增事件类型或新增环境变量，建议同步更新以下位置：

1. `src/types.ts`
2. `src/formatters.ts`
3. `docs/input-parameters.md`
4. `README.md`
