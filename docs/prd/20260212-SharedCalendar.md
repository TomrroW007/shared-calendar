背景与目标（你 1.1/1.2 原样保留）

PRD

用户与使用场景（建议补 3 个 Top 场景：家庭协调/小队活动/临时聚会）

范围定义

3.1 已实现（Current）（你“核心功能已实现”整体移到这里）

PRD

3.2 下一个版本 v1.2（Committed）（你“Dashboard/Agenda/Memo/Emoji”移到这里）

PRD

3.3 Backlog（Future / Research）（你调研后的高/中/低列表移到这里）

PRD

3.4 非目标（Non-goals）（新增：例如“不做完整企业级日历替代”“不做复杂资源预定”）

关键体验与流程

对应输出：flow-activity.md、sequence-sync.md

权限与隐私模型（必须显式化）

你已经有“公开/私人/仅状态”与 Admin/Member，这里定义规则表最关键。

PRD

通知与实时性策略

说明为什么用 SSE、刷新语义、断线重连、消息一致性（你已说明 SSE，可补策略）

PRD

验收标准（概览）

只放“关键验收点摘要”，细节放 docs/testing/acceptance-criteria.md

指标（Metrics）

例如：空间周活、提案转化率、投票参与率、同步延迟分位数

风险与开放问题

例如：SSE 扩展性、离线一致性、重复事件编辑语义、时区边界等（都来自你 backlog）

PRD

技术方案摘要（只放摘要）

技术细节放 ADR；PRD 只写“当前栈”与约束。