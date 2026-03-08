import { describe, expect, it } from "vitest";
import { parseHookConfig, resolveHookTarget } from "../src/config";
import { baseEnv } from "./helpers";

describe("config", () => {
  it("可以解析合法配置", () => {
    const config = parseHookConfig(baseEnv);
    expect(config.gh_webhooks["octo-org"]?.chat_id).toBe("@octo");
  });

  it("会拒绝非法 JSON", () => {
    expect(() =>
      parseHookConfig({
        ...baseEnv,
        HOOK_CONFIG_JSON: "{not-json}",
      }),
    ).toThrow(/不是合法 JSON/);
  });

  it("优先按组织名匹配，然后再按仓库名匹配", () => {
    const config = parseHookConfig(baseEnv);
    const target = resolveHookTarget(config, "Codertocat/Hello-World", "octo-org");
    expect(target?.secret).toBe("org-secret");
  });
});
