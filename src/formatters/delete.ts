import type { GitHubPayload } from "../types";
import { escapeHtml, formatField } from "./shared";

export function formatDelete(payload: GitHubPayload): string {
  return [
    formatField("Type", escapeHtml(payload.ref_type ?? "ref")),
    formatField("Name", `<code>${escapeHtml(payload.ref ?? "")}</code>`),
  ].join("\n");
}
