import type { GitHubPayload } from "../types";
import { formatLinkField, formatMissing, formatRepoStats } from "./shared";

export function formatFork(payload: GitHubPayload): string {
  const forkee = payload.forkee;
  if (!forkee || !payload.repository) {
    return formatMissing("Missing fork data");
  }

  return [
    formatLinkField("New repo", forkee.html_url, forkee.full_name),
    formatRepoStats(payload.repository),
  ].join("\n");
}
