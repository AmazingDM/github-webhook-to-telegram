import type { GitHubPayload } from "../types";
import {
  escapeHtml,
  formatField,
  formatLinkField,
  formatMissing,
  type FormatOptions,
} from "./shared";

export function formatPullRequest(payload: GitHubPayload, options?: FormatOptions): string {
  const pullRequest = payload.pull_request;
  if (!pullRequest) {
    return formatMissing("Missing pull request data");
  }

  const lines = [
    formatField("ID", `#${payload.number ?? ""}`),
  ];

  if (options?.showAuthor !== false) {
    lines.push(formatField("Author", `<code>${escapeHtml(pullRequest.user.login)}</code>`));
  }

  lines.push(formatLinkField("Title", pullRequest.html_url, pullRequest.title));
  return lines.join("\n");
}
