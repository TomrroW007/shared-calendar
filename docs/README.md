# Shared Calendar 文档中心

本目录包含 Shared Calendar 项目的所有文档资源。

## 📁 目录结构

- **[prd/](./prd/)** - 产品需求文档（Product Requirements Documents）
  - 记录功能需求、用户故事、验收标准
  - 命名格式：`YYYYMMDD-功能名.md`
- **[adr/](./adr/)** - 架构决策记录（Architecture Decision Records）
  - 记录重要的技术选型和架构决策
  - 命名格式：`ADR-序号-决策主题.md`
  - 参考模板：[templates/adr-template.md](./templates/adr-template.md)
- **[architecture/](./architecture/)** - 架构相关文档
  - **[c4/](./architecture/c4/)** - C4 模型图（Context, Container, Component, Code）
  - **[diagrams/](./architecture/diagrams/)** - 其他架构图（Mermaid 格式）
- **[testing/](./testing/)** - 测试相关文档
  - 测试计划、测试用例、自动化测试说明
- **[templates/](./templates/)** - 文档模板
  - 提供标准化的文档模板
- **[glossary.md](./glossary.md)** - 术语表
  - 项目通用术语和概念定义

## 📝 文档编写指南

### PRD 编写

- 每个重要功能创建独立的 PRD 文档
- 必须包含：目标、用户场景、功能范围、验收标准
- 使用日期前缀命名，便于追溯

### ADR 编写

- 重要技术选型、架构变更必须记录 ADR
- 使用模板：[templates/adr-template.md](./templates/adr-template.md)
- 状态标记：Proposed → Accepted/Rejected → Deprecated

### 架构图绘制

- 优先使用 Mermaid（文本化、易维护）
- 复杂系统使用 C4 模型
- 每次架构变更同步更新相关图表

### 测试文档

- 关键功能必须有测试计划
- 包含：测试场景、测试步骤、预期结果

## 🔄 文档同步规则

根据 `.github/copilot-instructions.md`，功能变更时需同步更新：

1. 如果范围/目标变化 → 更新 **prd/**
2. 如果流程/同步行为变化 → 更新 **architecture/diagrams/**
3. 如果行为变化需要新增/更新验收或测试 → 更新 **testing/**
4. 关键技术选型/行为边界变化 → 新增/更新 **ADR**

## 🔗 快速链接

- [术语表](./glossary.md) - 了解项目术语
- [最新 PRD](./prd/) - 查看产品需求
- [架构决策](./adr/) - 了解技术选型
- [架构图](./architecture/diagrams/) - 查看系统架构

## 🧭 Current TODO (prioritized)

- **P0 - Fix now**
  - `app/u/[username]/page.js`: Fix `setData(data)` bug to use fetched result. (Bug causing public booking page to show no data)
  - `lib/push.js`: Remove duplicate cleanup call for expired subscriptions.
  - Review SSE auth approach (`app/api/sse/route.js` + `components/useSSE.js`) — avoid sending long-lived tokens in URLs; plan migration to cookie-based auth or fetch-stream fallback.

- **P1 - Security & validation**
  - Add server-side validation (Zod/Joi) for all POST/PUT endpoints.
  - Sanitize user-provided markdown/HTML (`SpaceWiki`, `comments`, `memo`, `note`) before storing or rendering.
  - Add rate limiting for public endpoints (register, join, proposals, comments).

- **P2 - Performance & correctness**
  - Cache or background-sync external ICS fetches instead of fetching on each request.
  - Optimize member-count queries to use aggregation instead of N queries.
  - Centralize `authenticate` helper and standardize API error/response format.

- **P3 - Observability & tests**
  - Add unit tests for `lib/holidays.js`, `lib/nlp.js`, and API auth helper.
  - Add integration tests for event create/update/delete, RSVP flow, and proposal lifecycle.
  - Add CI (GitHub Actions) to run lint + tests on PRs.

If you'd like, I can start implementing the P0 fixes and open a small PR with tests and changelog. Which P0 item should I tackle first?

## ⚙️ Recent Dev Changes (for CI/Integration)

- Removed local `.env.local` from the repository to avoid committing secrets. Use CI/integration env vars for builds.
- Implemented short-lived SSE tokens to reduce long-lived token exposure: added `lib/sse-token.js` and endpoint `POST /api/sse/token`.
- Fixed `app/u/[username]/page.js` bug and removed duplicate cleanup in `lib/push.js`.
- Added unit tests for SSE token helper and push-utils; ran tests locally (all passing).

These changes are ready to be pushed to the repository and validated in your integration environment (CI). The `.env.local` file was removed locally; CI should provide `MONGODB_URI` and other secrets.
