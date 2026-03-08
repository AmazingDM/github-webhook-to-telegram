import type { Env, HookConfig, HookTarget } from "./types";

/**
 * 从环境变量中解析并校验项目配置。
 */
export function parseHookConfig(env: Env): HookConfig {
  if (!env.BOT_TOKEN) {
    throw new Error("缺少 BOT_TOKEN 环境变量。");
  }

  if (!env.HOOK_CONFIG_JSON) {
    throw new Error("缺少 HOOK_CONFIG_JSON 环境变量。");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(env.HOOK_CONFIG_JSON);
  } catch (error) {
    throw new Error(`HOOK_CONFIG_JSON 不是合法 JSON：${String(error)}`);
  }

  if (!isHookConfig(parsed)) {
    throw new Error("HOOK_CONFIG_JSON 结构不合法，必须包含 gh_webhooks 映射。");
  }

  return parsed;
}

/**
 * 根据仓库全名或组织名匹配目标配置。
 */
export function resolveHookTarget(
  config: HookConfig,
  repositoryFullName?: string,
  organizationLogin?: string,
): HookTarget | null {
  const lookupKeys = [organizationLogin, repositoryFullName].filter(
    (value): value is string => Boolean(value),
  );

  for (const key of lookupKeys) {
    const target = config.gh_webhooks[key];
    if (target) {
      return target;
    }
  }

  return null;
}

function isHookConfig(value: unknown): value is HookConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const ghWebhooks = (value as { gh_webhooks?: unknown }).gh_webhooks;
  if (!ghWebhooks || typeof ghWebhooks !== "object" || Array.isArray(ghWebhooks)) {
    return false;
  }

  return Object.values(ghWebhooks).every(isHookTarget);
}

function isHookTarget(value: unknown): value is HookTarget {
  if (!value || typeof value !== "object") {
    return false;
  }

  const target = value as Partial<HookTarget>;
  const validChatId =
    typeof target.chat_id === "string" || typeof target.chat_id === "number";

  return validChatId && typeof target.secret === "string" && target.secret.length > 0;
}
