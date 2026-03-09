import type { GitHubPayload } from "../types";
import { buildTitle, card, esc, formatRepoActor } from "./shared";

export function formatCreate(payload: GitHubPayload): string {
  const ref = payload.ref ?? "";
  const href = payload.repository?.html_url && ref ? `${payload.repository.html_url}/tree/${ref}` : undefined;

  return card(buildTitle("🌱", "Reference Created", href), [
    formatRepoActor(payload),
    `🏷️ ${esc(payload.ref_type ?? "ref")} · <code>${esc(ref)}</code>`,
  ]);
}
