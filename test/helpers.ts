import { createHmac } from "node:crypto";
import type { Env } from "../src/types";

export const baseEnv: Env = {
  BOT_TOKEN: "123456:token",
  HOOK_CONFIG_JSON: JSON.stringify({
    gh_webhooks: {
      "octo-org": {
        chat_id: "@octo",
        secret: "org-secret",
      },
      "Codertocat/Hello-World": {
        chat_id: -1001234567890,
        secret: "repo-secret",
      },
    },
  }),
};

export function signBody(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}
