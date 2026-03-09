/**
 * Worker 运行时注入的环境变量。
 */
export interface Env {
  BOT_TOKEN: string;
  HOOK_CONFIG_JSON: string;
}

/**
 * 单个 GitHub 仓库或组织对应的 Telegram 转发配置。
 */
export interface HookTarget {
  chat_id: string | number;
  secret: string;
}

/**
 * 运行时解析后的完整配置。
 */
export interface HookConfig {
  gh_webhooks: Record<string, HookTarget>;
}

/**
 * GitHub Webhook 负载中本项目真正依赖的最小字段集合。
 */
export interface GitHubPayload {
  action?: string;
  number?: number;
  ref?: string;
  ref_type?: string;
  forced?: boolean;
  compare?: string;
  after?: string;
  sender: {
    login: string;
  };
  repository?: {
    full_name: string;
    html_url?: string;
    stargazers_count?: number;
    forks_count?: number;
  };
  organization?: {
    login: string;
  };
  commits?: Array<{
    id: string;
    message: string;
    url: string;
    author: {
      username?: string;
      name?: string;
    };
  }>;
  head_commit?: {
    id?: string;
    message?: string;
  };
  discussion?: {
    html_url: string;
    title: string;
    number: number;
  };
  forkee?: {
    html_url: string;
    full_name: string;
  };
  issue?: {
    html_url: string;
    title: string;
    number: number;
    labels?: Array<{
      name: string;
    }>;
    assignees?: Array<{
      login: string;
    }>;
    milestone?: {
      title: string;
    } | null;
    body?: string;
  };
  pull_request?: {
    html_url: string;
    title: string;
    user: {
      login: string;
    };
    number?: number;
    merged?: boolean;
    labels?: Array<{
      name: string;
    }>;
    additions?: number;
    deletions?: number;
    changed_files?: number;
    requested_reviewers?: Array<{
      login: string;
    }>;
    merged_by?: {
      login: string;
    } | null;
    milestone?: {
      title: string;
    } | null;
    body?: string;
    head?: {
      ref: string;
    };
    base?: {
      ref: string;
    };
  };
  comment?: {
    html_url: string;
    body?: string;
    user: {
      login: string;
    };
  };
  workflow_run?: {
    conclusion?: string | null;
    html_url: string;
    name: string;
    head_branch?: string;
    head_commit?: {
      message?: string | null;
    } | null;
    head_sha?: string;
    run_attempt?: number;
  };
  label?: {
    name: string;
  };
}

/**
 * 校验 GitHub 请求后的统一结果，便于入口层决定 HTTP 响应。
 */
export interface ValidationResult {
  ok: boolean;
  chatId?: string | number;
  payload?: GitHubPayload;
  bodyText?: string;
  event?: string;
  reason?: string;
}
