import { resolveHookTarget } from "./config";
import type { GitHubPayload, HookConfig, ValidationResult } from "./types";

/**
 * 校验 GitHub Webhook 请求，并返回后续处理所需的数据。
 */
export async function validateGitHubWebhook(
  request: Request,
  config: HookConfig,
): Promise<ValidationResult> {
  const userAgent = request.headers.get("User-Agent") ?? "";
  if (!userAgent.startsWith("GitHub-Hookshot")) {
    return { ok: false, reason: "请求来源不是 GitHub Hookshot。" };
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { ok: false, reason: "Content-Type 必须为 application/json。" };
  }

  const signatureHeader = request.headers.get("X-Hub-Signature-256");
  if (!signatureHeader) {
    return { ok: false, reason: "缺少 X-Hub-Signature-256 请求头。" };
  }

  const event = request.headers.get("X-GitHub-Event") ?? "";
  const bodyText = await request.text();

  let payload: GitHubPayload;
  try {
    payload = JSON.parse(bodyText) as GitHubPayload;
  } catch {
    return { ok: false, reason: "请求体不是合法 JSON。" };
  }

  const target = resolveHookTarget(
    config,
    payload.repository?.full_name,
    payload.organization?.login,
  );
  if (!target) {
    return { ok: false, reason: "未找到匹配的仓库或组织配置。" };
  }

  const signature = signatureHeader.split("=")[1];
  if (!signature) {
    return { ok: false, reason: "X-Hub-Signature-256 格式非法。" };
  }

  const isValid = await verifySignature(target.secret, signature, bodyText);
  if (!isValid) {
    return { ok: false, reason: "GitHub Webhook 签名校验失败。" };
  }

  return {
    ok: true,
    chatId: target.chat_id,
    payload,
    bodyText,
    event,
  };
}

/**
 * 使用 Web Crypto API 完成 GitHub 的 HMAC SHA-256 校验。
 */
export async function verifySignature(
  secret: string,
  signature: string,
  bodyText: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(bodyText),
  );

  const expected = bufferToHex(digest);
  return timingSafeEqual(expected, signature);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 以常量时间方式比较签名，避免早停比较带来的时序差异。
 */
function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}
