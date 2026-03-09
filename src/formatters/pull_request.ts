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

export function formatPullRequest(payload: GitHubPayload): string {
  const pullRequest = payload.pull_request;
  if (!pullRequest) {
    return card(buildTitle("🔀", "Pull Request"), [formatRepoActor(payload)]);
  }

  const action = payload.action ?? "updated";
  let actionText = action.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  let emoji = "🔀";

  if (action === "closed" && pullRequest.merged) {
    actionText = "Merged";
    emoji = "🟣";
  } else if (action === "closed") {
    actionText = "Closed";
    emoji = "🔴";
  } else if (action === "opened") {
    actionText = "Opened";
    emoji = "🟢";
  } else if (action === "reopened") {
    actionText = "Reopened";
    emoji = "🔵";
  } else if (action === "ready_for_review") {
    actionText = "Ready for Review";
    emoji = "👀";
  }

  const title = buildTitle(
    emoji,
    `Pull Request ${actionText} #${pullRequest.number ?? payload.number ?? ""}`,
    pullRequest.html_url,
  );

  const body = [
    `📋 ${esc(pullRequest.title)}`,
    formatRepoActor(payload),
    `🌿 <code>${esc(pullRequest.head?.ref ?? "")}</code> → <code>${esc(pullRequest.base?.ref ?? "")}</code>`,
  ];

  const meta: string[] = [];
  if ((pullRequest.labels ?? []).length > 0) {
    meta.push(`🏷️ ${formatCodeList(pullRequest.labels ?? [])}`);
  }
  if (pullRequest.additions != null && pullRequest.deletions != null) {
    meta.push(
      `📊 <code>+${pullRequest.additions} -${pullRequest.deletions}</code> (${pullRequest.changed_files ?? "?"} files)`,
    );
  }
  if (meta.length > 0) {
    body.push(meta.join(" · "));
  }

  if ((pullRequest.requested_reviewers ?? []).length > 0) {
    body.push(`👀 ${formatUserCodeList(pullRequest.requested_reviewers ?? [])}`);
  }

  if (action === "closed" && pullRequest.merged && pullRequest.merged_by) {
    body.push(`🤝 Merged by <code>${esc(pullRequest.merged_by.login)}</code>`);
  }

  if (pullRequest.milestone) {
    body.push(`🎯 ${esc(pullRequest.milestone.title)}`);
  }

  if (action === "opened" && pullRequest.body) {
    body.push("", `💭 <i>${esc(truncate(pullRequest.body, 200))}</i>`);
  }

  return card(title, body);
}
