import { describe, expect, it } from "vitest";
import { escapeHtml, formatGitHubWebhook, getSupportedEvents } from "../src/formatters";

describe("formatters", () => {
  it("返回当前支持的事件列表", () => {
    expect(getSupportedEvents()).toContain("push");
  });

  it("会对 HTML 特殊字符做转义", () => {
    expect(escapeHtml("<tag> & \"quote\"")).toBe("&lt;tag&gt; &amp; &quot;quote&quot;");
  });

  it("格式化 push 事件时输出更醒目的结构化消息", () => {
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

    expect(text).toContain("🚀 <b>Push 推送</b>");
    expect(text).toContain("<b>分支</b> · <code>main</code>");
    expect(text).toContain("Fix &lt;bug&gt;");
    expect(text).toContain("<b>提交</b> · 1 条");
    expect(text).toContain("abcdef1");
  });

  it("格式化 pull request 事件时带上 emoji 和标题链接", () => {
    const text = formatGitHubWebhook("pull_request", {
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

    expect(text).toContain("🔀 <b>Pull Request 更新</b>");
    expect(text).toContain("<b>动作</b> · <code>opened</code>");
    expect(text).toContain('href="https://github.com/Codertocat/Hello-World/pull/7"');
    expect(text).toContain("Add feature");
  });

  it("不支持的事件返回空", () => {
    const text = formatGitHubWebhook("unknown", {
      sender: { login: "dash" },
    });

    expect(text).toBeNull();
  });
});
