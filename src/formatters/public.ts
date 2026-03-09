import type { GitHubPayload } from "../types";
import { buildTitle, card, formatRepo, formatRepoActor, formatRepoStats } from "./shared";

export function formatPublicEvent(payload: GitHubPayload): string {
  return card(buildTitle("🌍", "Repository Public", payload.repository?.html_url), [
    formatRepoActor(payload),
    formatRepo(payload.repository),
    formatRepoStats(payload.repository),
  ]);
}
