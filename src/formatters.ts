import type { GitHubPayload } from "./types";

type Formatter = (payload: GitHubPayload) => string | null;

interface EventMeta {
  icon: string;
  label: string;
}

const EVENT_META: Record<string, EventMeta> = {
  create: { icon: "🌱", label: "创建引用" },
  delete: { icon: "🗑️", label: "删除引用" },
  discussion: { icon: "💬", label: "Discussion 更新" },
  fork: { icon: "🍴", label: "仓库 Fork" },
  issues: { icon: "🐞", label: "Issue 更新" },
  ping: { icon: "📡", label: "Webhook Ping" },
  public: { icon: "🌍", label: "仓库公开" },
  pull_request: { icon: "🔀", label: "Pull Request 更新" },
  push: { icon: "🚀", label: "Push 推送" },
  star: { icon: "⭐", label: "Star 变动" },
};

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
  const meta = EVENT_META[event];
  if (!formatter || !meta) {
    return null;
  }

  const details = formatter(payload);

  return buildMessage({
    payload,
    details,
    ...meta,
  });
}

export function getSupportedEvents(): string[] {
  return Object.keys(EVENT_FORMATTERS);
}

function formatCreate(payload: GitHubPayload): string {
  return [
    formatField("类型", escapeHtml(payload.ref_type ?? "ref")),
    formatField("名称", `<code>${escapeHtml(payload.ref ?? "")}</code>`),
    formatLinkField(
      "链接",
      `${payload.repository?.html_url ?? ""}/tree/${payload.ref ?? ""}`,
      payload.ref ?? "查看引用",
    ),
  ].join("\n");
}

function formatDelete(payload: GitHubPayload): string {
  return [
    formatField("类型", escapeHtml(payload.ref_type ?? "ref")),
    formatField("名称", `<code>${escapeHtml(payload.ref ?? "")}</code>`),
  ].join("\n");
}

function formatDiscussion(payload: GitHubPayload): string {
  const discussion = payload.discussion;
  if (!discussion) {
    return formatMissing("缺少 discussion 数据");
  }

  return [
    formatField("编号", `#${discussion.number}`),
    formatLinkField("标题", discussion.html_url, discussion.title),
  ].join("\n");
}

function formatFork(payload: GitHubPayload): string {
  const forkee = payload.forkee;
  if (!forkee || !payload.repository) {
    return formatMissing("缺少 fork 数据");
  }

  return [
    formatLinkField("新仓库", forkee.html_url, forkee.full_name),
    formatRepoStats(payload.repository),
  ].join("\n");
}

function formatIssues(payload: GitHubPayload): string {
  const issue = payload.issue;
  if (!issue) {
    return formatMissing("缺少 issue 数据");
  }

  return [
    formatField("编号", `#${issue.number}`),
    formatLinkField("标题", issue.html_url, issue.title),
  ].join("\n");
}

function formatPing(): string {
  return "✅ <i>Webhook 地址已可访问，GitHub Ping 校验通过。</i>";
}

function formatPublicEvent(payload: GitHubPayload): string {
  if (!payload.repository) {
    return formatMissing("缺少 repository 数据");
  }

  return [
    formatLinkField("仓库", payload.repository.html_url, payload.repository.full_name),
    formatRepoStats(payload.repository),
  ].join("\n");
}

function formatPullRequest(payload: GitHubPayload): string {
  const pullRequest = payload.pull_request;
  if (!pullRequest) {
    return formatMissing("缺少 pull_request 数据");
  }

  return [
    formatField("编号", `#${payload.number ?? ""}`),
    formatField("作者", `<code>${escapeHtml(pullRequest.user.login)}</code>`),
    formatLinkField("标题", pullRequest.html_url, pullRequest.title),
  ].join("\n");
}

function formatPush(payload: GitHubPayload): string {
  const commits = payload.commits ?? [];
  const lines = [formatField("分支", `<code>${escapeHtml(formatRef(payload.ref))}</code>`)];

  if (commits.length === 0) {
    lines.push("📝 <i>本次 push 未携带 commit 摘要。</i>");
    return lines.join("\n");
  }

  lines.push(`<b>提交</b> · ${commits.length} 条`);

  for (const commit of commits) {
    const author = commit.author.username ?? commit.author.name ?? "unknown";
    lines.push(
      `• <a href="${commit.url}"><code>${escapeHtml(
        commit.id.slice(0, 7),
      )}</code></a> ${escapeHtml(commit.message)}`,
    );
    lines.push(`  └ 作者：<code>${escapeHtml(author)}</code>`);
  }

  return lines.join("\n");
}

function formatStar(payload: GitHubPayload): string {
  if (!payload.repository) {
    return formatMissing("缺少 repository 数据");
  }

  return formatRepoStats(payload.repository);
}

function buildMessage({
  icon,
  label,
  payload,
  details,
}: EventMeta & { payload: GitHubPayload; details: string | null }): string {
  const lines = [`${icon} <b>${label}</b>`, formatRepositoryLine(payload), formatActorLine(payload)];

  if (payload.action) {
    lines.push(formatField("动作", `<code>${escapeHtml(payload.action)}</code>`));
  }

  if (details) {
    lines.push("", details);
  }

  return lines.join("\n");
}

function formatRepositoryLine(payload: GitHubPayload): string {
  if (payload.repository) {
    return formatLinkField("仓库", payload.repository.html_url, payload.repository.full_name);
  }

  return formatField("目标", escapeHtml(payload.organization?.login ?? "unknown"));
}

function formatActorLine(payload: GitHubPayload): string {
  return formatField("操作者", `<code>${escapeHtml(payload.sender.login)}</code>`);
}

function formatRepoStats(repo: GitHubPayload["repository"]): string {
  if (!repo) {
    return formatMissing("缺少 repository 数据");
  }

  return `⭐ <b>${repo.stargazers_count}</b> stars · 🍴 <b>${repo.forks_count}</b> forks`;
}

function formatField(label: string, value: string): string {
  return `<b>${label}</b> · ${value}`;
}

function formatLinkField(label: string, href: string, text: string): string {
  return formatField(label, `<a href="${href}">${escapeHtml(text)}</a>`);
}

function formatMissing(message: string): string {
  return `⚠️ <i>${escapeHtml(message)}。</i>`;
}

function formatRef(ref?: string): string {
  if (!ref) {
    return "";
  }

  return ref
    .replace(/^refs\/heads\//, "")
    .replace(/^refs\/tags\//, "")
    .replace(/^refs\//, "");
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
