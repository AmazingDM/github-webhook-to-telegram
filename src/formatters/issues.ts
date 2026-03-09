import type { GitHubPayload } from "../types";
import {
  buildTitle,
  card,
  esc,
  formatCodeList,
  formatRepoActor,
  formatUserCodeList,
  truncate,
} from "./shared";

const ACTION_MAP: Record<string, [string, string]> = {
  opened: ["Opened", "🟢"],
  closed: ["Closed", "🔴"],
  reopened: ["Reopened", "🔵"],
  edited: ["Edited", "✏️"],
  labeled: ["Labeled", "🏷️"],
  unlabeled: ["Unlabeled", "🏷️"],
};

export function formatIssues(payload: GitHubPayload): string {
  const issue = payload.issue;
  if (!issue) {
    return card(buildTitle("🐞", "Issue"), [formatRepoActor(payload)]);
  }

  const action = payload.action ?? "updated";
  const [actionText, emoji] = ACTION_MAP[action] ?? [
    action.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    "🗂️",
  ];

  const title = buildTitle(emoji, `Issue ${actionText} #${issue.number}`, issue.html_url);
  const body = [`📋 ${esc(issue.title)}`, formatRepoActor(payload)];

  if ((action === "labeled" || action === "unlabeled") && payload.label) {
    body.push(`🏷️ ${action === "labeled" ? "Added" : "Removed"}: <code>${esc(payload.label.name)}</code>`);
  } else if ((issue.labels ?? []).length > 0) {
    body.push(`🏷️ ${formatCodeList(issue.labels ?? [])}`);
  }

  if ((issue.assignees ?? []).length > 0) {
    body.push(`👥 ${formatUserCodeList(issue.assignees ?? [])}`);
  }

  if (issue.milestone) {
    body.push(`🎯 ${esc(issue.milestone.title)}`);
  }

  if ((action === "opened" || action === "edited") && issue.body) {
    body.push("", `💭 <i>${esc(truncate(issue.body, 200))}</i>`);
  }

  return card(title, body);
}
