import type { GitHubPayload } from "../types";
import { escapeHtml, formatField, formatMissing, formatRef, type FormatOptions } from "./shared";

export function formatPush(payload: GitHubPayload, options?: FormatOptions): string {
  const commits = payload.commits ?? [];
  const lines = [formatField("Branch", `<code>${escapeHtml(formatRef(payload.ref))}</code>`)];

  if (commits.length === 0) {
    lines.push("📝 <i>No commit summary was included in this push payload.</i>");
    return lines.join("\n");
  }

  lines.push(`<b>Commits</b> · ${commits.length}`);

  for (const commit of commits) {
    lines.push(
      `• <a href="${commit.url}"><code>${escapeHtml(
        commit.id.slice(0, 7),
      )}</code></a> ${escapeHtml(commit.message)}`,
    );
    if (options?.showAuthor !== false) {
      const author = commit.author.username ?? commit.author.name ?? "unknown";
      lines.push(`  └ Author: <code>${escapeHtml(author)}</code>`);
    }
  }

  return lines.join("\n");
}
