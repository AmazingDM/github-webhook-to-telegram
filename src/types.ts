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
  sender: {
    login: string;
  };
  repository?: {
    full_name: string;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
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
  };
  pull_request?: {
    html_url: string;
    title: string;
    user: {
      login: string;
    };
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
