import type { GitHubPayload } from "../types";

export type Formatter = (payload: GitHubPayload) => string | null;

export interface EventMeta {
  icon: string;
  label: string;
}

export const EVENT_META: Record<string, EventMeta> = {
  create: { icon: "🌱", label: "Reference Created" },
  delete: { icon: "🗑️", label: "Reference Deleted" },
  discussion: { icon: "💬", label: "Discussion Activity" },
  fork: { icon: "🍴", label: "Repository Forked" },
  issues: { icon: "🐞", label: "Issue Activity" },
  ping: { icon: "📡", label: "Webhook Ping" },
  public: { icon: "🌍", label: "Repository Public" },
  pull_request: { icon: "🔀", label: "Pull Request Activity" },
  push: { icon: "🚀", label: "Push Update" },
  star: { icon: "⭐", label: "Stars Updated" },
};

export function buildMessage({
  icon,
  label,
  payload,
  details,
}: EventMeta & { payload: GitHubPayload; details: string | null }): string {
  const lines = [
    `${icon} <b>${label}</b>`,
    formatRepositoryLine(payload),
    formatActorLine(payload),
  ];

  if (payload.action) {
    lines.push(formatField("Action", `<code>${escapeHtml(payload.action)}</code>`));
  }

  if (details) {
    lines.push("", details);
  }

  return lines.join("\n");
}

export function formatRepositoryLine(payload: GitHubPayload): string {
  if (payload.repository) {
    return formatLinkField("Repository", payload.repository.html_url, payload.repository.full_name);
  }

  return formatField("Target", escapeHtml(payload.organization?.login ?? "unknown"));
}

export function formatActorLine(payload: GitHubPayload): string {
  return formatField("Actor", `<code>${escapeHtml(payload.sender.login)}</code>`);
}

export function formatRepoStats(repo: GitHubPayload["repository"]): string {
  if (!repo) {
    return formatMissing("Missing repository data");
  }

  return `⭐ <b>${repo.stargazers_count}</b> stars · 🍴 <b>${repo.forks_count}</b> forks`;
}

export function formatField(label: string, value: string): string {
  return `<b>${label}</b> · ${value}`;
}

export function formatLinkField(label: string, href: string | undefined, text: string): string {
  if (!href) {
    return formatField(label, escapeHtml(text));
  }

  return formatField(label, `<a href="${href}">${escapeHtml(text)}</a>`);
}

export function formatMissing(message: string): string {
  return `⚠️ <i>${escapeHtml(message)}.</i>`;
}

export function formatRef(ref?: string): string {
  if (!ref) {
    return "";
  }

  return ref
    .replace(/^refs\/heads\//, "")
    .replace(/^refs\/tags\//, "")
    .replace(/^refs\//, "");
}

/**
 * Telegram uses HTML parse mode, so escape reserved characters once here.
 */
export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
