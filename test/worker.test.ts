import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleRequest } from "../src/index";
import { baseEnv, signBody } from "./helpers";

describe("worker handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("非 POST 请求返回 405", async () => {
    const response = await handleRequest(new Request("https://example.com/"), baseEnv);
    expect(response.status).toBe(405);
  });

  it("未知路径返回 404", async () => {
    const response = await handleRequest(
      new Request("https://example.com/health", { method: "POST" }),
      baseEnv,
    );
    expect(response.status).toBe(404);
  });

  it("未支持的事件返回 nothing to send", async () => {
    const body = JSON.stringify({
      sender: { login: "dash" },
      repository: {
        full_name: "Codertocat/Hello-World",
      },
    });

    const response = await handleRequest(
      new Request("https://example.com/", {
        method: "POST",
        headers: {
          "User-Agent": "GitHub-Hookshot/abc123",
          "Content-Type": "application/json",
          "X-GitHub-Event": "watch",
          "X-Hub-Signature-256": `sha256=${signBody("repo-secret", body)}`,
        },
        body,
      }),
      baseEnv,
    );

    expect(await response.text()).toBe("Send to Telegram: nothing to send");
  });

  it("发送成功时返回 succeed", async () => {
    const body = JSON.stringify({
      sender: { login: "dash" },
      action: "opened",
      number: 7,
      repository: {
        full_name: "Codertocat/Hello-World",
        html_url: "https://github.com/Codertocat/Hello-World",
        stargazers_count: 1,
        forks_count: 2,
      },
      pull_request: {
        html_url: "https://github.com/Codertocat/Hello-World/pull/7",
        title: "Add feature",
        user: { login: "dash" },
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const response = await handleRequest(
      new Request("https://example.com/", {
        method: "POST",
        headers: {
          "User-Agent": "GitHub-Hookshot/abc123",
          "Content-Type": "application/json",
          "X-GitHub-Event": "pull_request",
          "X-Hub-Signature-256": `sha256=${signBody("repo-secret", body)}`,
        },
        body,
      }),
      baseEnv,
    );

    expect(await response.text()).toBe("Send to Telegram: succeed");
  });

  it("show_author 为 false 时不把人名发到 Telegram", async () => {
    const body = JSON.stringify({
      sender: { login: "dash" },
      action: "opened",
      number: 7,
      repository: {
        full_name: "Codertocat/Hello-World",
        html_url: "https://github.com/Codertocat/Hello-World",
        stargazers_count: 1,
        forks_count: 2,
      },
      pull_request: {
        html_url: "https://github.com/Codertocat/Hello-World/pull/7",
        title: "Add feature",
        user: { login: "octocat" },
      },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await handleRequest(
      new Request("https://example.com/", {
        method: "POST",
        headers: {
          "User-Agent": "GitHub-Hookshot/abc123",
          "Content-Type": "application/json",
          "X-GitHub-Event": "pull_request",
          "X-Hub-Signature-256": `sha256=${signBody("repo-secret", body)}`,
        },
        body,
      }),
      {
        ...baseEnv,
        HOOK_CONFIG_JSON: JSON.stringify({
          gh_webhooks: {
            "Codertocat/Hello-World": {
              chat_id: -1001234567890,
              secret: "repo-secret",
              show_author: false,
            },
          },
        }),
      },
    );

    expect(await response.text()).toBe("Send to Telegram: succeed");
    const sent = new URLSearchParams(String(fetchMock.mock.calls[0]?.[1]?.body));
    const text = sent.get("text") ?? "";
    expect(text).toContain("Add feature");
    expect(text).not.toContain("Actor");
    expect(text).not.toContain("Author");
    expect(text).not.toContain("dash");
    expect(text).not.toContain("octocat");
  });
});
