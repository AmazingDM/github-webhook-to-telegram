# 更新记录

> English: [changelog.md](changelog.md)

## 2026-03-08
- 将项目从 Python `aiohttp` 重写为 Cloudflare Workers + TypeScript。
- 新增 `wrangler.toml`、`package.json`、`tsconfig.json`，建立 Workers 工具链基础设施。
- 在 `src/` 下拆分配置、GitHub 校验、消息格式化和 Telegram 发送逻辑。
- 新增 `test/` 目录，覆盖配置解析、校验、格式化、发送和 Worker 入口处理。
- 扩展使用、部署、迁移和架构文档。
- 将 GitHub Actions 从旧的 Python 流程替换为 Node.js 构建与测试流程。
- 将依赖升级到当前稳定版本，并把最低 Node.js 版本提高到 20+。
- 为 Worker 打包产物增加 CI artifact 上传。

