import type { GitHubPayload } from "../types";
import { buildTitle, card, esc, firstLine, formatRepo, truncate } from "./shared";

export function formatWorkflowRun(payload: GitHubPayload): string {
  const run = payload.workflow_run;
  if (!run) {
    return card(buildTitle("ℹ️", "CI Status"), [formatRepo(payload.repository)]);
  }

  const conclusion = run.conclusion ?? "unknown";
  const emoji = conclusion === "failed" ? "🚨" : conclusion === "cancelled" ? "⚠️" : conclusion === "timed_out" ? "⏱️" : "ℹ️";
  const status = conclusion.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const title = buildTitle(emoji, `CI ${status}`, run.html_url);
  const body = [
    formatRepo(payload.repository),
    `🔧 <code>${esc(run.name)}</code> · 🌿 <code>${esc(run.head_branch ?? "")}</code>`,
  ];

  if (run.head_commit?.message) {
    body.push(`📝 <code>${esc((run.head_sha ?? "").slice(0, 7))}</code> ${esc(truncate(firstLine(run.head_commit.message), 80))}`);
  }

  if ((run.run_attempt ?? 1) > 1) {
    body.push(`🔄 Attempt #${run.run_attempt}`);
  }

  return card(title, body);
}
