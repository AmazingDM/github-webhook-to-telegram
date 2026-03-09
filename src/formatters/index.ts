import { formatCreate } from "./create";
import { formatDelete } from "./delete";
import { formatDiscussion } from "./discussion";
import { formatFork } from "./fork";
import { formatIssues } from "./issues";
import { formatPing } from "./ping";
import { formatPublicEvent } from "./public";
import { formatPullRequest } from "./pull_request";
import { formatPush } from "./push";
import { formatStar } from "./star";
import { buildMessage, escapeHtml, EVENT_META, formatRef } from "./shared";
import type { Formatter } from "./shared";
import type { GitHubPayload } from "../types";

const EVENT_FORMATTERS: Record<string, Formatter> = {
  create: formatCreate,
  delete: formatDelete,
  discussion: formatDiscussion,
  fork: formatFork,
  issues: formatIssues,
  ping: formatPing,
  public: formatPublicEvent,
  pull_request: formatPullRequest,
  push: formatPush,
  star: formatStar,
};

/**
 * Convert a GitHub webhook payload into a Telegram HTML message.
 */
export function formatGitHubWebhook(
  event: string,
  payload: GitHubPayload,
): string | null {
  const formatter = EVENT_FORMATTERS[event];
  const meta = EVENT_META[event];
  if (!formatter || !meta) {
    return null;
  }

  return buildMessage({
    payload,
    details: formatter(payload),
    ...meta,
  });
}

export function getSupportedEvents(): string[] {
  return Object.keys(EVENT_FORMATTERS);
}

export { escapeHtml, formatRef };
