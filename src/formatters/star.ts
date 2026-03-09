import type { GitHubPayload } from "../types";
import { buildTitle, card, formatRepoActor, formatRepoStats } from "./shared";

export function formatStar(payload: GitHubPayload): string {
  return card(buildTitle("⭐", "Stars Updated", payload.repository?.html_url), [
    formatRepoActor(payload),
    formatRepoStats(payload.repository),
  ]);
}
