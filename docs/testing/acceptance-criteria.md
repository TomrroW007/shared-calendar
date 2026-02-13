# Acceptance Criteria（验收标准）

## Definition of Done（通用）
- [ ] PRD(v1.2) 的 P0 全部实现
- [ ] 若涉及关键决策变更，补 ADR
- [ ] 关键流程图/时序图已更新
- [ ] 覆盖核心 E2E（至少 1 条 happy path + 1 条异常路径）
- [ ] 无 P0/P1 缺陷遗留

---

## AC-001 匿名注册与持久化
Given 用户首次打开应用
When 用户设置昵称并进入应用
Then 系统生成 token 并持久化
And 重新打开页面后仍保持登录态

## AC-002 Space 创建与邀请码加入
Given 用户 A 已登录
When A 创建 space 并生成 6 位邀请码
Then 用户 B 输入邀请码可以加入该 space
And B 在空间中角色为 Member

## AC-003 月视图 + 状态标记 + 隐私可见性
Given 用户在某个 space 内
When 用户在日历上标记某日状态为“休假”
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

## AC-005 SSE 准实时刷新与通知中心
Given 用户 A 与 B 同时打开同一 space
And 双方已订阅 SSE
When A 创建事件/更新状态/确认提案日期
Then B 的页面在短时间内自动刷新到最新状态
And 通知中心产生相应记录
