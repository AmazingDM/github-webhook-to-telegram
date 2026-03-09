import type { GitHubPayload } from "../types";

export type Formatter = (payload: GitHubPayload) => string | null;

export function card(title: string, bodyLines: Array<string | null | undefined>): string {
  const body = bodyLines.filter((line): line is string => line != null).join("\n");
  return `${title}\n\n<blockquote>${body}</blockquote>`;
}

export function truncate(text?: string | null, maxLen = 200): string {
  if (!text) {
    return "";
  }

  const normalized = text.split(/\s+/).join(" ").trim();
  return normalized.length > maxLen ? `${normalized.slice(0, maxLen)}…` : normalized;
}

export function buildTitle(icon: string, label: string, href?: string): string {
  if (!href) {
    return `${icon} <b>${esc(label)}</b>`;
  }

  return `${icon} <a href="${esc(href)}"><b>${esc(label)}</b></a>`;
}

export function formatRepo(repo?: GitHubPayload["repository"]): string {
  return `📦 <code>${esc(repo?.full_name ?? "unknown")}</code>`;
}

export function formatActor(login?: string): string {
  return `👤 <code>${esc(login ?? "unknown")}</code>`;
}

export function formatRepoActor(payload: GitHubPayload): string {
  return `${formatRepo(payload.repository)} · ${formatActor(payload.sender.login)}`;
}

export function formatRepoStats(repo?: GitHubPayload["repository"]): string {
  return `⭐ <b>${repo?.stargazers_count ?? 0}</b> stars · 🍴 <b>${repo?.forks_count ?? 0}</b> forks`;
}

export function formatCodeList(entries: Array<{ name: string } | null | undefined>): string {
  return entries.map((entry) => `<code>${esc(entry?.name ?? "")}</code>`).join(" ");
}

export function formatUserCodeList(entries: Array<{ login: string } | null | undefined>): string {
  return entries.map((entry) => `<code>${esc(entry?.login ?? "")}</code>`).join(" ");
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

export function firstLine(text?: string | null): string {
  return text?.split("\n")[0] ?? "";
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

export function esc(value: unknown): string {
  return value == null ? "" : escapeHtml(String(value));
}
