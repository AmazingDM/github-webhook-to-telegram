import type { GitHubPayload } from "../types";
import { formatField, formatLinkField, formatMissing } from "./shared";

export function formatIssues(payload: GitHubPayload): string {
  const issue = payload.issue;
  if (!issue) {
    return formatMissing("Missing issue data");
  }

  return [
    formatField("ID", `#${issue.number}`),
    formatLinkField("Title", issue.html_url, issue.title),
  ].join("\n");
}
