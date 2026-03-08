import { describe, expect, it } from "vitest";
import { parseHookConfig } from "../src/config";
import { validateGitHubWebhook, verifySignature } from "../src/github";
import { baseEnv, signBody } from "./helpers";

describe("github webhook validation", () => {
  it("可以校验合法签名", async () => {
    await expect(verifySignature("repo-secret", signBody("repo-secret", "{}"), "{}")).resolves.toBe(
      true,
    );
  });

  it("会拒绝非 GitHub 请求", async () => {
    const config = parseHookConfig(baseEnv);
    const request = new Request("https://example.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": "sha256=deadbeef",
      },
      body: "{}",
    });

    const result = await validateGitHubWebhook(request, config);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/不是 GitHub Hookshot/);
  });

  it("会通过仓库配置校验合法请求", async () => {
    const config = parseHookConfig(baseEnv);
    const body = JSON.stringify({
      sender: { login: "dash" },
      repository: {
        full_name: "Codertocat/Hello-World",
      },
    });

    const request = new Request("https://example.com/", {
      method: "POST",
      headers: {
        "User-Agent": "GitHub-Hookshot/abc123",
        "Content-Type": "application/json",
        "X-GitHub-Event": "ping",
        "X-Hub-Signature-256": `sha256=${signBody("repo-secret", body)}`,
      },
      body,
    });

    const result = await validateGitHubWebhook(request, config);
    expect(result.ok).toBe(true);
    expect(result.chatId).toBe(-1001234567890);
    expect(result.event).toBe("ping");
  });
});
