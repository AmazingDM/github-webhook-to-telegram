import type { GitHubPayload } from "../types";
import { formatMissing, formatRepoStats } from "./shared";

export function formatStar(payload: GitHubPayload): string {
  if (!payload.repository) {
    return formatMissing("Missing repository data");
  }

  return formatRepoStats(payload.repository);
}
