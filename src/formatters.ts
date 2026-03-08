import type { GitHubPayload } from "./types";

type Formatter = (payload: GitHubPayload) => string | null;

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
 * 将 GitHub Webhook 负载转成 Telegram HTML 消息。
 */
export function formatGitHubWebhook(
  event: string,
  payload: GitHubPayload,
): string | null {
  const formatter = EVENT_FORMATTERS[event];
  if (!formatter) {
    return null;
  }

  const title = getEventTitle(event, payload);
  const details = formatter(payload);
  return details ? `${title}\n${details}` : title;
}

export function getSupportedEvents(): string[] {
  return Object.keys(EVENT_FORMATTERS);
}

function formatCreate(payload: GitHubPayload): string {
  return `→ <a href="${payload.repository?.html_url}/tree/${payload.ref}">${escapeHtml(
    payload.ref_type ?? "ref",
  )}: ${escapeHtml(payload.ref ?? "")}</a>`;
}

function formatDelete(payload: GitHubPayload): string {
  return `→ ${escapeHtml(payload.ref_type ?? "ref")}: <code>${escapeHtml(
    payload.ref ?? "",
  )}</code>`;
}

function formatDiscussion(payload: GitHubPayload): string {
  const discussion = payload.discussion;
  if (!discussion) {
    return "→ 缺少 discussion 数据。";
  }

  return `→ <a href="${discussion.html_url}">${escapeHtml(
    discussion.title,
  )} · Discussion #${discussion.number}</a>`;
}

function formatFork(payload: GitHubPayload): string {
  const forkee = payload.forkee;
  if (!forkee || !payload.repository) {
    return "→ 缺少 fork 数据。";
  }

  return [
    `→ <a href="${forkee.html_url}">${escapeHtml(forkee.full_name)}</a>`,
    getRepoStarAndFork(payload.repository),
  ].join("\n");
}

function formatIssues(payload: GitHubPayload): string {
  const issue = payload.issue;
  if (!issue) {
    return "→ 缺少 issue 数据。";
  }

  return `→ <a href="${issue.html_url}">${escapeHtml(
    issue.title,
  )} · Issue #${issue.number}</a>`;
}

function formatPing(): null {
  return null;
}

function formatPublicEvent(payload: GitHubPayload): string {
  if (!payload.repository) {
    return "→ 缺少 repository 数据。";
  }

  return `→ <a href="${payload.repository.html_url}">${escapeHtml(
    payload.repository.full_name,
  )}</a>`;
}

function formatPullRequest(payload: GitHubPayload): string {
  const pullRequest = payload.pull_request;
  if (!pullRequest) {
    return "→ 缺少 pull_request 数据。";
  }

  const title = `${escapeHtml(pullRequest.title)} by ${escapeHtml(
    pullRequest.user.login,
  )} · Pull Request #${payload.number ?? ""}`;

  return `→ <a href="${pullRequest.html_url}">${title}</a>`;
}

function formatPush(payload: GitHubPayload): string {
  const commits = payload.commits ?? [];
  const lines = [`→ ${escapeHtml(payload.ref ?? "")}`];

  for (const commit of commits) {
    const author = commit.author.username ?? commit.author.name ?? "unknown";
    lines.push(
      `→ <code>${escapeHtml(author)}</code> ${escapeHtml(commit.message)} [<a href="${
        commit.url
      }">${escapeHtml(commit.id.slice(0, 7))}</a>]`,
    );
  }

  return lines.join("\n");
}

function formatStar(payload: GitHubPayload): string {
  if (!payload.repository) {
    return "→ 缺少 repository 数据。";
  }

  return getRepoStarAndFork(payload.repository);
}

function getEventTitle(event: string, payload: GitHubPayload): string {
  const name = payload.repository?.full_name ?? payload.organization?.login ?? "unknown";
  const summaryParts = [payload.sender.login];
  if (payload.action) {
    summaryParts.push(payload.action);
  }
  summaryParts.push(event);

  return `<b>${escapeHtml(name)}</b> | <i>${escapeHtml(summaryParts.join(" "))}</i>`;
}

function getRepoStarAndFork(repo: GitHubPayload["repository"]): string {
  if (!repo) {
    return "→ 缺少 repository 数据。";
  }

  return `→ <b>${repo.stargazers_count}</b> stargazers, <b>${repo.forks_count}</b> forks`;
}

/**
 * Telegram 使用 HTML parse mode，这里统一做实体转义。
 */
export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
