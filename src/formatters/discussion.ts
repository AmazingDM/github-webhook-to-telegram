import type { GitHubPayload } from "../types";
import { buildTitle, card, esc, formatRepoActor } from "./shared";

export function formatDiscussion(payload: GitHubPayload): string {
  const discussion = payload.discussion;
  if (!discussion) {
    return card(buildTitle("💬", "Discussion Activity"), [formatRepoActor(payload)]);
  }

  return card(buildTitle("💬", `Discussion #${discussion.number}`, discussion.html_url), [
    `📋 ${esc(discussion.title)}`,
    formatRepoActor(payload),
  ]);
}
