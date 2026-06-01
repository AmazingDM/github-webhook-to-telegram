# 更新记录

> English: [changelog.md](changelog.md)

## 当前版本
- 推荐使用 fork + GitHub Actions Secrets + 手动发布或 tag 发布的部署方式。
- 普通提交只运行检查，手动运行 deploy workflow 或推送 Git tag 才发布到 Cloudflare Worker。
- fork 仓库可以使用每日 `Sync Upstream` workflow，在安全时快进同步上游。
- `BOT_TOKEN` 和 `HOOK_CONFIG_JSON` 由部署 workflow 同步为 Worker Secrets。
- 使用 pnpm、Node.js 24、TypeScript、Vitest 和 Wrangler。

## 初始 Workers 版本
- 从 Python `aiohttp` 重写为 Cloudflare Workers + TypeScript。
- 拆分配置解析、GitHub 校验、消息格式化和 Telegram 发送逻辑。
- 新增测试覆盖：配置、签名校验、消息格式、Telegram 调用和 Worker 响应。
- 新增中英文文档。
