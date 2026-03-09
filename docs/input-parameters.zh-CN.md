# 传入参数说明

> English: [input-parameters.md](input-parameters.md)

本文档汇总 Worker 当前实现会读取的主要输入参数，包括：
- Wrangler / Cloudflare Workers 注入的运行时环境变量
- GitHub Webhook HTTP 请求头
- GitHub Webhook JSON 请求体字段

文档内容以当前实现为准，入口见 `src/index.ts`。

## 1. 运行时环境变量
Worker 会读取以下变量：

| 变量名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `BOT_TOKEN` | `string` | 是 | Telegram Bot Token，用于调用 Telegram Bot API。缺失时会快速失败。 |
| `HOOK_CONFIG_JSON` | `string` | 是 | GitHub Webhook 路由配置，必须是合法 JSON 字符串。缺失或结构非法时会快速失败。 |

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

### 1.2 `gh_webhooks` 字段
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gh_webhooks` | `Record<string, HookTarget>` | 是 | 仓库或组织到 Telegram 目标的映射表 |
| `gh_webhooks.<key>` | `object` | 是 | 单个路由定义；`key` 可以是仓库全名，也可以是组织名 |
| `gh_webhooks.<key>.chat_id` | `string \| number` | 是 | Telegram 目标聊天 ID，支持数值 ID 和公开 `@channel_name` |
| `gh_webhooks.<key>.secret` | `string` | 是 | 用于校验 `X-Hub-Signature-256` 的 GitHub Webhook Secret |

### 1.3 路由匹配顺序
项目会按以下顺序匹配 `HOOK_CONFIG_JSON`：
1. `payload.organization.login`
2. `payload.repository.full_name`

如果组织和仓库同时命中，组织级路由优先。

## 2. Webhook 请求入口条件
| 项目 | 固定值 / 规则 | 说明 |
| --- | --- | --- |
| 请求路径 | `POST /` | 只有根路径且方法为 `POST` 才进入业务逻辑 |
| 非根路径 | `404` | 例如 `POST /foo` 会被拒绝 |
| 非 `POST` 方法 | `405` | 例如 `GET /` 会被拒绝 |

## 3. GitHub Webhook 请求头
当前实现会显式读取或校验以下请求头：

| 请求头 | 必填 | 规则 | 说明 |
| --- | --- | --- | --- |
| `User-Agent` | 是 | 必须以 `GitHub-Hookshot` 开头 | 用于快速确认请求看起来来自 GitHub |
| `Content-Type` | 是 | 必须以 `application/json` 开头 | 当前仅接受 JSON 负载 |
| `X-Hub-Signature-256` | 是 | 必须是 `sha256=<hex>` | 用于 HMAC SHA-256 校验 |
| `X-GitHub-Event` | 否，但强烈建议提供 | 任意字符串 | 选择对应事件格式器；未支持事件会被忽略而不是报错 |

### 3.1 `X-Hub-Signature-256`
签名处理遵循 GitHub 约定：
- 原始请求体文本参与 HMAC SHA-256 计算
- 签名密钥来自命中的 `gh_webhooks.<key>.secret`
- 实现会比较 `sha256=` 之后的十六进制摘要

如果签名缺失、格式错误或校验失败，服务会返回 `403 Forbidden`。

## 4. GitHub Webhook JSON 请求体
请求体必须是合法 JSON。项目不会依赖 GitHub 的完整 payload 结构，只读取当前实现真正需要的最小字段集合。

## 5. 通用字段
| 字段路径 | 类型 | 条件必填情况 | 说明 |
| --- | --- | --- | --- |
| `action` | `string` | 条件必填 | 出现在 `opened`、`created`、`deleted` 等动作型事件中 |
| `sender.login` | `string` | 实际上应视为必填 | 作为通知头部中的操作者显示 |
| `repository.full_name` | `string` | 条件必填 | 用于路由匹配和仓库显示 |
| `repository.html_url` | `string` | 条件必填 | 用于拼接仓库链接 |
| `repository.stargazers_count` | `number` | 条件必填 | `star` 和 `fork` 消息会使用 |
| `repository.forks_count` | `number` | 条件必填 | `star` 和 `fork` 消息会使用 |
| `organization.login` | `string` | 可选 | 用于组织级路由匹配和回退显示 |
| `number` | `number` | 条件必填 | `issues`、`pull_request`、`discussion` 会使用 |
| `ref` | `string` | 条件必填 | `create`、`delete`、`push` 会使用 |
| `ref_type` | `string` | 条件必填 | `create`、`delete` 会使用，例如 `branch` 或 `tag` |

## 6. 事件专属字段
### 6.1 `create`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `ref_type` | `string` | 被创建的引用类型 |
| `ref` | `string` | 被创建的分支名或标签名 |
| `repository.html_url` | `string` | 用于拼接引用链接 |

### 6.2 `delete`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `ref_type` | `string` | 被删除的引用类型 |
| `ref` | `string` | 被删除的分支名或标签名 |

### 6.3 `discussion`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `discussion.html_url` | `string` | Discussion 页面链接 |
| `discussion.title` | `string` | Discussion 标题 |
| `discussion.number` | `number` | Discussion 编号 |

### 6.4 `fork`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `forkee.html_url` | `string` | 新 Fork 仓库链接 |
| `forkee.full_name` | `string` | 新 Fork 仓库全名 |
| `repository.stargazers_count` | `number` | 原仓库 star 数 |
| `repository.forks_count` | `number` | 原仓库 fork 数 |

### 6.5 `issues`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `issue.html_url` | `string` | Issue 页面链接 |
| `issue.title` | `string` | Issue 标题 |
| `issue.number` | `number` | Issue 编号 |

### 6.6 `ping`
`ping` 只依赖通用头部字段，并输出一个连通性确认消息。

### 6.7 `public`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `repository.html_url` | `string` | 仓库链接 |
| `repository.full_name` | `string` | 仓库全名 |

### 6.8 `pull_request`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `pull_request.html_url` | `string` | Pull Request 链接 |
| `pull_request.title` | `string` | Pull Request 标题 |
| `pull_request.user.login` | `string` | Pull Request 作者 |
| `number` | `number` | Pull Request 编号 |

### 6.9 `push`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `ref` | `string` | 被推送的 Git 引用 |
| `commits` | `Array<object>` | 提交列表 |
| `commits[].id` | `string` | Commit SHA，消息中会截短为 7 位 |
| `commits[].message` | `string` | Commit 信息 |
| `commits[].url` | `string` | Commit 链接 |
| `commits[].author.username` | `string` | 优先使用的作者用户名 |
| `commits[].author.name` | `string` | 回退使用的作者显示名 |

### 6.10 `star`
| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `repository.stargazers_count` | `number` | 当前 star 数 |
| `repository.forks_count` | `number` | 当前 fork 数 |

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
- 请求校验仍可能成功
- 不会发送 Telegram 消息
- 响应会是 `Send to Telegram: nothing to send`

## 8. 代码来源位置
| 参数类别 | 主要代码位置 |
| --- | --- |
| 运行时变量解析 | `src/config.ts` |
| 请求路径与方法校验 | `src/index.ts` |
| 请求头与签名校验 | `src/github.ts` |
| 请求体类型定义 | `src/types.ts` |
| 事件格式化逻辑 | `src/formatters/` |

## 9. 维护建议
后续如果新增事件类型或运行时变量，建议同步更新以下位置：
1. `src/types.ts`
2. `src/formatters/`
3. `docs/input-parameters.md`
4. `README.md`
