# Acceptance Criteria（验收标准）

## Definition of Done（通用）

- [ ] PRD(v1.2) 的 P0 全部实现
- [ ] 若涉及关键决策变更，补 ADR
- [ ] 关键流程图/时序图已更新
- [ ] 覆盖核心 E2E（至少 1 条 happy path + 1 条异常路径）
- [ ] 无 P0/P1 缺陷遗留

---

## AC-001 用户注册、安全登录与会话持久化

Given 用户首次打开应用

When 用户输入唯一的用户名、安全密码及昵称进行注册并登录

Then 系统使用 bcryptjs 进行密码哈希存储，并生成 JWT Session Token 写入安全 `HttpOnly` Cookie

And 用户重新打开页面或进行 API 请求时，Next.js Edge Middleware 自动拦截验证 JWT Cookie 并保持登录态，免疫 XSS 攻击

## AC-002 Space 创建与邀请码加入

Given 用户 A 已登录

When A 创建 space 并生成 6 位邀请码

Then 用户 B 输入邀请码可以加入该 space

And B 在空间中角色为 Member

## AC-003 月视图 + 状态标记 + 隐私可见性

Given 用户在某个 space 内

When 用户在日历上标记某日状态为"休假"

Then 自己能看到该状态

And 其他成员在不同可见性设置下符合展示规则：

- 公开：看到状态/事件细节
- 私人（仅忙碌）：仅看到忙碌占用，不展示细节
- 仅状态：看到状态但不展示事件细节

## AC-004 提案投票与确认日期

Given space 内存在一个提案，包含多个候选日期

When 成员对每个日期投票（有空/没空/待定）

Then 发起人能看到汇总结果

When 发起人确认最终日期

Then 所有成员收到通知中心记录

And 日历中显示最终安排（按产品定义）

## AC-005 Pusher WebSockets 实时同步与通知中心

Given 用户 A 与 B 同时打开同一 space

And 双方均通过 `/api/pusher/auth` 安全鉴权并订阅 Pusher WebSockets 私有通道

When A 创建事件、更新状态或确认提案日期

Then Pusher 实时网关向订阅的私有通道广播对应事件

And B 的客户端页面即时响应并刷新到最新状态，且通知中心产生相应记录
