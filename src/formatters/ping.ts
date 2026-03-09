import { buildTitle, card } from "./shared";

export function formatPing(): string {
  return card(buildTitle("📡", "Webhook Ping"), ["✅ <i>The webhook endpoint is reachable and GitHub ping validation passed.</i>"]);
}
