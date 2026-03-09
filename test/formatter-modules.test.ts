import { describe, expect, it } from "vitest";
import { formatIssues } from "../src/formatters/issues";
import { formatPullRequest } from "../src/formatters/pull_request";
import { formatPush } from "../src/formatters/push";

describe("formatter modules", () => {
  it("formats push details from the dedicated push module", () => {
    const text = formatPush({
      sender: { login: "dash" },
      ref: "refs/heads/main",
      commits: [
        {
          id: "abcdef123456",
          message: "Ship release",
          url: "https://github.com/Codertocat/Hello-World/commit/abcdef1",
          author: { username: "dash" },
        },
      ],
    });

    expect(text).toContain("<b>Branch</b> · <code>main</code>");
    expect(text).toContain("<b>Commits</b> · 1");
    expect(text).toContain("Ship release");
  });

  it("formats pull request details from the dedicated module", () => {
    const text = formatPullRequest({
      sender: { login: "dash" },
      number: 42,
      pull_request: {
        html_url: "https://github.com/Codertocat/Hello-World/pull/42",
        title: "Improve docs",
        user: { login: "octo" },
      },
    });

    expect(text).toContain("<b>ID</b> · #42");
    expect(text).toContain("Author");
    expect(text).toContain("Improve docs");
  });

  it("returns a clear missing-data message for incomplete issue payloads", () => {
    const text = formatIssues({
      sender: { login: "dash" },
    });

    expect(text).toBe("⚠️ <i>Missing issue data.</i>");
  });
});
