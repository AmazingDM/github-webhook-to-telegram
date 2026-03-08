import { describe, expect, it } from "vitest";
import { escapeHtml, formatGitHubWebhook, getSupportedEvents } from "../src/formatters";

describe("formatters", () => {
  it("返回当前支持的事件列表", () => {
    expect(getSupportedEvents()).toContain("push");
  });

  it("会对 HTML 特殊字符做转义", () => {
    expect(escapeHtml("<tag> & \"quote\"")).toBe("&lt;tag&gt; &amp; &quot;quote&quot;");
  });

  it("格式化 push 事件时保留提交摘要", () => {
    const text = formatGitHubWebhook("push", {
      sender: { login: "dash" },
      ref: "refs/heads/main",
      repository: {
        full_name: "Codertocat/Hello-World",
        html_url: "https://github.com/Codertocat/Hello-World",
        stargazers_count: 1,
        forks_count: 2,
      },
      commits: [
        {
          id: "abcdef123456",
          message: "Fix <bug>",
          url: "https://github.com/Codertocat/Hello-World/commit/abcdef1",
          author: { username: "dash" },
        },
      ],
    });

    expect(text).toContain("Fix &lt;bug&gt;");
    expect(text).toContain("abcdef1");
  });

  it("不支持的事件返回空", () => {
    const text = formatGitHubWebhook("unknown", {
      sender: { login: "dash" },
    });

    expect(text).toBeNull();
  });
});
