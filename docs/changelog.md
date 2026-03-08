# 更新记录

## 2026-03-08
- 将项目从 Python `aiohttp` 重写为 Cloudflare Workers + TypeScript。
- 新增 `wrangler.toml`、`package.json`、`tsconfig.json`，建立 Workers 工程基础设施。
- 新增 `src/` 模块化代码，拆分配置、GitHub 校验、消息格式化和 Telegram 发送逻辑。
- 新增 `test/` 测试目录，补充配置、校验、格式化、发送和入口处理测试。
- 将主 README 改为中文，补充部署、打包、测试和迁移说明。
- 新增 `docs/architecture.md`、`docs/migration.md`，记录设计和迁移细节。
- 新增 `docs/usage.md`、`docs/deployment.md`，补充详细使用教程和部署教程。
- 将 GitHub Actions 从 Python lint 流程替换为 Node.js 构建与测试流程。
- 将顶层依赖升级到 npm registry 当前最新稳定版本，并同步把最低 Node 版本要求提高到 20+。
- GitHub Actions 增强为自动构建流程，并上传 Worker 打包产物作为 artifact。
