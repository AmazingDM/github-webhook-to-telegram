import type { GitHubPayload } from "../types";
import { buildTitle, card, esc, firstLine, formatRef, formatRepo, formatActor, truncate } from "./shared";

export function formatPush(payload: GitHubPayload): string {
  const commits = payload.commits ?? [];
  const repoName = payload.repository?.full_name ?? "";
  const branch = formatRef(payload.ref);
  const sha = payload.after ?? payload.head_commit?.id ?? commits[0]?.id ?? "";
  const url = payload.compare || (repoName && sha ? `https://github.com/${repoName}/commit/${sha}` : undefined);
  const title = buildTitle(payload.forced ? "⚠️" : "🚀", payload.forced ? "Force Push" : "New Push", url);
  const body = [
    `${formatRepo(payload.repository)} · 🌿 <code>${esc(branch)}</code>`,
    formatActor(payload.sender.login),
  ];

  if (commits.length > 0) {
    body.push("", `📝 <b>Commits (${commits.length})</b>`);
    for (const commit of commits.slice(0, 5)) {
      const short = commit.id.slice(0, 7);
      const message = truncate(firstLine(commit.message), 60);
      const commitUrl = repoName ? `https://github.com/${repoName}/commit/${commit.id}` : undefined;
      if (commitUrl) {
        body.push(`• <a href="${esc(commitUrl)}"><code>${esc(short)}</code></a> ${esc(message)}`);
      } else {
        body.push(`• <code>${esc(short)}</code> ${esc(message)}`);
      }
    }

    if (commits.length > 5) {
      body.push(`… and ${commits.length - 5} more`);
    }
  } else if (payload.head_commit?.message) {
    const message = truncate(firstLine(payload.head_commit.message), 80);
    const commitUrl = repoName && sha ? `https://github.com/${repoName}/commit/${sha}` : undefined;
    if (commitUrl) {
      body.push(`📝 <a href="${esc(commitUrl)}"><code>${esc(sha.slice(0, 7))}</code></a> ${esc(message)}`);
    } else {
      body.push(`📝 <code>${esc(sha.slice(0, 7))}</code> ${esc(message)}`);
    }
  }

  return card(title, body);
}
