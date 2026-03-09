import { describe, expect, it } from "vitest";
import { escapeHtml, formatGitHubWebhook, formatRef, getSupportedEvents } from "../src/formatters";

describe("formatters entrypoint", () => {
  it("returns the current supported event list", () => {
    expect(getSupportedEvents()).toEqual([
      "create",
      "delete",
      "discussion",
      "fork",
      "issue_comment",
      "issues",
      "ping",
      "public",
      "pull_request",
      "push",
      "star",
      "workflow_run",
    ]);
  });

  it("escapes reserved HTML characters", () => {
    expect(escapeHtml("<tag> & \"quote\"")).toBe("&lt;tag&gt; &amp; &quot;quote&quot;");
  });

  it("normalizes git refs for display", () => {
    expect(formatRef("refs/heads/main")).toBe("main");
    expect(formatRef("refs/tags/v1.0.0")).toBe("v1.0.0");
  });

  it("formats push events as HTML cards", () => {
    const text = formatGitHubWebhook("push", {
      sender: { login: "dash" },
      ref: "refs/heads/main",
      compare: "https://github.com/Codertocat/Hello-World/compare/old...new",
      repository: {
        full_name: "Codertocat/Hello-World",
        html_url: "https://github.com/Codertocat/Hello-World",
        stargazers_count: 1,
        forks_count: 2,
      },
      commits: [
        {
          id: "abcdef123456",
          message: "Fix <bug>\n\nMore details",
          url: "https://github.com/Codertocat/Hello-World/commit/abcdef1",
          author: { username: "dash" },
        },
      ],
    });

    expect(text).toContain('🚀 <a href="https://github.com/Codertocat/Hello-World/compare/old...new"><b>New Push</b></a>');
    expect(text).toContain("<blockquote>");
    expect(text).toContain("📦 <code>Codertocat/Hello-World</code> · 🌿 <code>main</code>");
    expect(text).toContain("👤 <code>dash</code>");
    expect(text).toContain("📝 <b>Commits (1)</b>");
    expect(text).toContain("Fix &lt;bug&gt;");
  });

  it("formats pull request events with the new card layout", () => {
    const text = formatGitHubWebhook("pull_request", {
      sender: { login: "dash" },
      action: "opened",
      number: 7,
      repository: {
        full_name: "Codertocat/Hello-World",
        html_url: "https://github.com/Codertocat/Hello-World",
      },
      pull_request: {
        html_url: "https://github.com/Codertocat/Hello-World/pull/7",
        title: "Add feature",
        user: { login: "dash" },
        head: { ref: "feature" },
        base: { ref: "main" },
        labels: [{ name: "feature" }],
        additions: 10,
        deletions: 2,
        changed_files: 3,
        body: "Adds a new endpoint",
      },
    });

    expect(text).toContain('🟢 <a href="https://github.com/Codertocat/Hello-World/pull/7"><b>Pull Request Opened #7</b></a>');
    expect(text).toContain("📋 Add feature");
    expect(text).toContain("🌿 <code>feature</code> → <code>main</code>");
    expect(text).toContain("🏷️ <code>feature</code>");
    expect(text).toContain("📊 <code>+10 -2</code> (3 files)");
    expect(text).toContain("💭 <i>Adds a new endpoint</i>");
  });

  it("returns null for unsupported events", () => {
    const text = formatGitHubWebhook("unknown", {
      sender: { login: "dash" },
    });

    expect(text).toBeNull();
  });
});
