import { describe, expect, it } from "vitest";
import { escapeHtml, formatGitHubWebhook, formatRef, getSupportedEvents } from "../src/formatters";

describe("formatters entrypoint", () => {
  it("returns the current supported event list", () => {
    expect(getSupportedEvents()).toEqual([
      "create",
      "delete",
      "discussion",
      "fork",
      "issues",
      "ping",
      "public",
      "pull_request",
      "push",
      "star",
    ]);
  });

  it("escapes reserved HTML characters", () => {
    expect(escapeHtml("<tag> & \"quote\"")).toBe("&lt;tag&gt; &amp; &quot;quote&quot;");
  });

  it("normalizes git refs for display", () => {
    expect(formatRef("refs/heads/main")).toBe("main");
    expect(formatRef("refs/tags/v1.0.0")).toBe("v1.0.0");
  });

  it("formats push events as structured English messages", () => {
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

    expect(text).toContain("🚀 <b>Push Update</b>");
    expect(text).toContain("<b>Branch</b> · <code>main</code>");
    expect(text).toContain("Fix &lt;bug&gt;");
    expect(text).toContain("<b>Commits</b> · 1");
    expect(text).toContain("Author: <code>dash</code>");
  });

  it("formats pull request events with title links", () => {
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

    expect(text).toContain("🔀 <b>Pull Request Activity</b>");
    expect(text).toContain("<b>Action</b> · <code>opened</code>");
    expect(text).toContain('href="https://github.com/Codertocat/Hello-World/pull/7"');
    expect(text).toContain("Add feature");
  });

  it("returns null for unsupported events", () => {
    const text = formatGitHubWebhook("unknown", {
      sender: { login: "dash" },
    });

    expect(text).toBeNull();
  });
});
