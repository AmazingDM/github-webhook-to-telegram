import type { GitHubPayload } from "../types";
import { buildTitle, card, esc, formatRepoActor } from "./shared";

export function formatDelete(payload: GitHubPayload): string {
  return card(buildTitle("🗑️", "Reference Deleted"), [
    formatRepoActor(payload),
    `🏷️ ${esc(payload.ref_type ?? "ref")} · <code>${esc(payload.ref ?? "")}</code>`,
  ]);
}
