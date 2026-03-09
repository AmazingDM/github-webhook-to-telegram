import type { GitHubPayload } from "../types";
import { buildTitle, card, esc, formatRepoActor, formatRepoStats } from "./shared";

export function formatFork(payload: GitHubPayload): string {
  const forkee = payload.forkee;
  if (!forkee) {
    return card(buildTitle("🍴", "Repository Forked"), [formatRepoActor(payload)]);
  }

  return card(buildTitle("🍴", "Repository Forked", forkee.html_url), [
    formatRepoActor(payload),
    `🆕 <code>${esc(forkee.full_name)}</code>`,
    formatRepoStats(payload.repository),
  ]);
}
