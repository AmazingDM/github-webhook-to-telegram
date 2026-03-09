import type { GitHubPayload } from "../types";
import { escapeHtml, formatField, formatLinkField, formatMissing } from "./shared";

export function formatPullRequest(payload: GitHubPayload): string {
  const pullRequest = payload.pull_request;
  if (!pullRequest) {
    return formatMissing("Missing pull request data");
  }

  return [
    formatField("ID", `#${payload.number ?? ""}`),
    formatField("Author", `<code>${escapeHtml(pullRequest.user.login)}</code>`),
    formatLinkField("Title", pullRequest.html_url, pullRequest.title),
  ].join("\n");
}
