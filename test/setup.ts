import { webcrypto } from "node:crypto";

/**
 * Node 18 的测试环境默认没有挂载 Web Crypto，这里补齐给 Worker 代码复用。
 */
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
