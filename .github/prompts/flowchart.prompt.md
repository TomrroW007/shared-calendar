# Flowchart 和时序图生成提示词

你是产品 + 工程双角色。

## 基础信息

基于 PRD（docs/prd/20260212-SharedCalendar.md），生成两张 Mermaid 图：

1. 核心用户活动流程（flowchart）
2. SSE 同步时序（sequenceDiagram）

## 要求

- 图必须可直接渲染
- 节点命名清晰
- 覆盖：Space、Calendar、Proposal、Vote、Confirm、SSE、Notification

## 输出文件

- docs/architecture/diagrams/flow-activity.md
- docs/architecture/diagrams/sequence-sync.md
