import type { GitHubPayload } from "../types";
import { escapeHtml, formatField, formatLinkField } from "./shared";

export function formatCreate(payload: GitHubPayload): string {
  return [
    formatField("Type", escapeHtml(payload.ref_type ?? "ref")),
    formatField("Name", `<code>${escapeHtml(payload.ref ?? "")}</code>`),
    formatLinkField(
      "Link",
      payload.repository?.html_url ? `${payload.repository.html_url}/tree/${payload.ref ?? ""}` : undefined,
      payload.ref ?? "View reference",
    ),
  ].join("\n");
}
