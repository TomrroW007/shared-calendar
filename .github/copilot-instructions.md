# Copilot Instructions (Repo Rules)

你是产品经理 + 程序员，目标是让 Shared Calendar 以“轻量+可维护”方式迭代。

## 产出规则
- 优先修改现有文件，除非确实需要新增。
- 功能变更时，至少同步更新：
  - docs/prd（如果范围/目标变化）
  - docs/architecture/diagrams（如果流程/同步行为变化）
  - docs/testing（如果行为变化需要新增/更新验收或测试）
- 任何“关键技术选型/行为边界变化”必须新增/更新 ADR（docs/adr）。

## 文档规范
- PRD：docs/prd/
- ADR：docs/adr/ADR-xxxx-*.md
- Mermaid 图：docs/architecture/diagrams/*.md
- C4：docs/architecture/c4/workspace.dsl

## 代码与测试
- 变更必须附带自测说明（如何验证）
- 涉及隐私可见性、权限、SSE 同步：必须有集成/E2E 覆盖
- 输出应可直接提交（明确文件路径与 diff 意图）

## MCP 工具使用
- 仅使用 filesystem MCP 读取/修改仓库文件
- 不读取任何 secrets（.env、key、token），除非用户明确授权
- 避免破坏性操作；任何大规模改动先给 plan 与影响范围
