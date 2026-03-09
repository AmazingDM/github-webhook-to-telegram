import type { GitHubPayload } from "../types";
import { formatLinkField, formatMissing, formatRepoStats } from "./shared";

export function formatPublicEvent(payload: GitHubPayload): string {
  if (!payload.repository) {
    return formatMissing("Missing repository data");
  }

  return [
    formatLinkField("Repository", payload.repository.html_url, payload.repository.full_name),
    formatRepoStats(payload.repository),
  ].join("\n");
}
