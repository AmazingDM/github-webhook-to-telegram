/**
 * 发送 Telegram 消息时所需的最小请求信息。
 */
export interface TelegramSendParams {
  botToken: string;
  chatId: string | number;
  text: string;
}

/**
 * 发送消息到 Telegram，并返回是否成功。
 */
export async function sendTelegramMessage(
  params: TelegramSendParams,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const apiUrl = `https://api.telegram.org/bot${params.botToken}/sendMessage`;
  const response = await fetchImpl(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({
      chat_id: String(params.chatId),
      text: params.text,
      parse_mode: "HTML",
      disable_web_page_preview: "true",
      disable_notification: "true",
    }),
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { ok?: boolean; result?: unknown };
  return Boolean(data.ok && data.result);
}
