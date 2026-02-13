# Activity Flow: Shared Calendar（核心流程）

```mermaid
flowchart TD
  A[Open App] --> B{Has token?}
  B -- No --> C[Set nickname + generate token]
  B -- Yes --> D[Load user profile]

  D --> E[Dashboard: today overview]
  E --> F{Select space?}
  F -- No --> G[Create space or Join by invite code]
  F -- Yes --> H[Enter space]

  H --> I[Calendar View: Month/Agenda]
  I --> J[Mark day status (busy/leave/free/tentative)]
  I --> K[Create/Update event]
  I --> L[Create proposal (multi-date)]
  L --> M[Members vote (free/busy/tentative)]
  M --> N[Owner confirms final date]

  J --> S[SSE push updates]
  K --> S
  N --> S
  S --> T[All clients refresh UI + notification center]


---

## `docs/architecture/diagrams/sequence-sync.md`

```md
# Sequence: Data Sync via SSE（准实时刷新）

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant W as WebApp
  participant A as API (Route Handlers)
  participant D as MongoDB
  participant S as SSE Stream

  U->>W: Open space
  W->>A: GET /api/space/{id}/snapshot
  A->>D: Query snapshot (spaces/events/proposals/status)
  D-->>A: Snapshot
  A-->>W: 200 OK (Snapshot)

  W->>A: GET /api/space/{id}/sse (subscribe)
  A-->>S: Start streaming updates

  U->>W: Update status / create event / vote
  W->>A: POST /api/... (mutation)
  A->>D: Write mutation
  D-->>A: OK
  A-->>S: Emit event (type, spaceId, version, payload)
  S-->>W: Push update event
  W-->>U: Refresh UI + update notification center


---

## `docs/testing/test-plan-calendar.md`

```md
# Test Plan: Shared Calendar

## 1. Scope
### In Scope
- 用户匿名注册与 Token 持久化
- Spaces：创建/加入/邀请码/角色（Admin/Member）
- Calendar：月视图、状态标记、隐私可见性
- Proposals：提案、投票、确认最终日期
- SSE：准实时刷新 + 通知中心
- v1.2：Dashboard、Agenda View、Space Memo、Emoji 映射

### Out of Scope（本轮不测或轻测）
- 重复事件 / 离线 / 附件 / 时区转换 / 外部预约链接（Roadmap）

## 2. Test Strategy
- Unit：纯函数（emoji 映射、日期计算、投票统计）优先
- Integration：Route Handlers + DB（CRUD、权限、可见性）
- E2E：核心流程（创建空间→加入→标记状态→提案投票→确认→SSE 同步）
- Manual：弱网/断线重连、移动端密集日程阅读体验

## 3. Test Matrix
- 浏览器：Chrome / Safari（移动端重点）
- 网络：正常 / 弱网 / 离线→恢复
- 角色：Admin / Member
- 隐私：公开 / 私人（仅忙碌）/ 仅状态

## 4. Environments & Data
- 环境：local / staging
- 测试账号：A(管理员)、B(成员)、C(成员)
- 数据准备：一个空间 + 一组事件 + 一组提案（含多日期）

## 5. Entry / Exit Criteria
### Entry
- PRD v1.2 范围冻结
- 关键接口与数据模型稳定
### Exit
- P0 场景全部通过
- SSE 断线重连可用（至少：自动重连 + 不重复应用）
- 无阻断缺陷（Crash / 数据丢失 / 权限泄露）

## 6. Risks & Mitigations
- 风险：SSE 断线导致状态不同步
  - 对策：客户端重连 + 增量拉取（by version）兜底
- 风险：隐私可见性实现错误导致信息泄露
  - 对策：服务端强校验 + 集成测试覆盖可见性矩阵
