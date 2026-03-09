import type { GitHubPayload } from "../types";
import { buildTitle, card, esc, formatRepo, truncate } from "./shared";

export function formatIssueComment(payload: GitHubPayload): string {
  const issue = payload.issue;
  const comment = payload.comment;
  if (!issue || !comment) {
    return card(buildTitle("💬", "New Comment"), [formatRepo(payload.repository)]);
  }

  const title = buildTitle("💬", `New Comment #${issue.number}`, comment.html_url);
  const body = [
    `📋 ${esc(issue.title)}`,
    `${formatRepo(payload.repository)} · 👤 <code>${esc(comment.user.login)}</code>`,
  ];

  if (comment.body) {
    body.push("", `💭 <i>${esc(truncate(comment.body, 300))}</i>`);
  }

  return card(title, body);
}
