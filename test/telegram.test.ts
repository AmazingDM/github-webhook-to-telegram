import { describe, expect, it, vi } from "vitest";
import { sendTelegramMessage } from "../src/telegram";

describe("telegram", () => {
  it("Telegram 返回 ok=true 时判定为成功", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      sendTelegramMessage(
        {
          botToken: "123456:token",
          chatId: "@octo",
          text: "hello",
        },
        fetchMock,
      ),
    ).resolves.toBe(true);
  });

  it("Telegram 返回错误状态码时判定为失败", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("bad", { status: 500 }));

    await expect(
      sendTelegramMessage(
        {
          botToken: "123456:token",
          chatId: "@octo",
          text: "hello",
        },
        fetchMock,
      ),
    ).resolves.toBe(false);
  });
});
