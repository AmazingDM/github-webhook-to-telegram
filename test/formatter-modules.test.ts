import { describe, expect, it } from "vitest";
import { formatIssueComment } from "../src/formatters/issue_comment";
import { formatIssues } from "../src/formatters/issues";
import { formatPullRequest } from "../src/formatters/pull_request";
import { formatPush } from "../src/formatters/push";
import { formatWorkflowRun } from "../src/formatters/workflow_run";

describe("formatter modules", () => {
  it("formats push details from the dedicated push module", () => {
    const text = formatPush({
      sender: { login: "dash" },
      ref: "refs/heads/main",
      compare: "https://github.com/Codertocat/Hello-World/compare/old...new",
      repository: {
        full_name: "Codertocat/Hello-World",
      },
      commits: [
        {
          id: "abcdef123456",
          message: "Ship release",
          url: "https://github.com/Codertocat/Hello-World/commit/abcdef1",
          author: { username: "dash" },
        },
      ],
    });

    expect(text).toContain("New Push");
    expect(text).toContain("📦 <code>Codertocat/Hello-World</code> · 🌿 <code>main</code>");
    expect(text).toContain("📝 <b>Commits (1)</b>");
    expect(text).toContain("Ship release");
  });

  it("formats pull request details from the dedicated module", () => {
    const text = formatPullRequest({
      sender: { login: "dash" },
      number: 42,
      action: "closed",
      repository: {
        full_name: "Codertocat/Hello-World",
      },
      pull_request: {
        html_url: "https://github.com/Codertocat/Hello-World/pull/42",
        title: "Improve docs",
        user: { login: "octo" },
        merged: true,
        merged_by: { login: "octo" },
        head: { ref: "docs" },
        base: { ref: "main" },
      },
    });

    expect(text).toContain("Pull Request Merged #42");
    expect(text).toContain("🤝 Merged by <code>octo</code>");
    expect(text).toContain("🌿 <code>docs</code> → <code>main</code>");
  });

  it("formats issue comments with comment author and body", () => {
    const text = formatIssueComment({
      sender: { login: "dash" },
      repository: { full_name: "Codertocat/Hello-World" },
      issue: {
        html_url: "https://github.com/Codertocat/Hello-World/issues/8",
        title: "Bug report",
        number: 8,
      },
      comment: {
        html_url: "https://github.com/Codertocat/Hello-World/issues/8#issuecomment-1",
        user: { login: "octo" },
        body: "Please verify the fix.",
      },
    });

    expect(text).toContain("New Comment #8");
    expect(text).toContain("👤 <code>octo</code>");
    expect(text).toContain("Please verify the fix.");
  });

  it("formats workflow runs with workflow metadata", () => {
    const text = formatWorkflowRun({
      sender: { login: "dash" },
      repository: { full_name: "Codertocat/Hello-World" },
      workflow_run: {
        conclusion: "failed",
        html_url: "https://github.com/Codertocat/Hello-World/actions/runs/1",
        name: "CI",
        head_branch: "main",
        head_sha: "abcdef123456",
        head_commit: { message: "Fix release pipeline" },
        run_attempt: 2,
      },
    });

    expect(text).toContain("CI Failed");
    expect(text).toContain("🔧 <code>CI</code> · 🌿 <code>main</code>");
    expect(text).toContain("📝 <code>abcdef1</code> Fix release pipeline");
    expect(text).toContain("🔄 Attempt #2");
  });

  it("formats issues as cards", () => {
    const text = formatIssues({
      sender: { login: "dash" },
      action: "labeled",
      repository: { full_name: "Codertocat/Hello-World" },
      label: { name: "bug" },
      issue: {
        html_url: "https://github.com/Codertocat/Hello-World/issues/8",
        title: "Bug report",
        number: 8,
      },
    });

    expect(text).toContain("Issue Labeled #8");
    expect(text).toContain("🏷️ Added: <code>bug</code>");
  });
});
