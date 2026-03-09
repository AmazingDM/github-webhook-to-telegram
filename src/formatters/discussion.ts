import type { GitHubPayload } from "../types";
import { formatField, formatLinkField, formatMissing } from "./shared";

export function formatDiscussion(payload: GitHubPayload): string {
  const discussion = payload.discussion;
  if (!discussion) {
    return formatMissing("Missing discussion data");
  }

  return [
    formatField("ID", `#${discussion.number}`),
    formatLinkField("Title", discussion.html_url, discussion.title),
  ].join("\n");
}
