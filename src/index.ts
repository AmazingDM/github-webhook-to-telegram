import { parseHookConfig } from "./config";
import { formatGitHubWebhook } from "./formatters";
import { validateGitHubWebhook } from "./github";
import { sendTelegramMessage } from "./telegram";
import type { Env } from "./types";

/**
 * Worker 主入口：只接收 GitHub Webhook，并将消息转发到 Telegram。
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("处理请求时发生未捕获异常：", error);
      return new Response("500: Internal Server Error", { status: 500 });
    }
  },
};

/**
 * 单独导出请求处理函数，方便在单元测试中直接调用。
 */
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/") {
    return new Response("404: Not Found", { status: 404 });
  }

  if (request.method !== "POST") {
    return new Response("405: Method Not Allowed", { status: 405 });
  }

  const config = parseHookConfig(env);
  const validation = await validateGitHubWebhook(request, config);
  if (!validation.ok || !validation.chatId || !validation.payload) {
    console.warn("Webhook 校验失败：", validation.reason);
    return new Response("403: Forbidden", { status: 403 });
  }

  const message = formatGitHubWebhook(validation.event ?? "", validation.payload);
  if (!message) {
    return new Response("Send to Telegram: nothing to send");
  }

  const sent = await sendTelegramMessage({
    botToken: env.BOT_TOKEN,
    chatId: validation.chatId,
    text: message,
  });

  return new Response(`Send to Telegram: ${sent ? "succeed" : "failed"}`);
}
