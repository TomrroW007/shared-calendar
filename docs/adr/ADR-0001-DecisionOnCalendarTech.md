# ADR-0001: Shared Calendar 技术选型与边界

- Status: Accepted
- Date: 2026-02-12
- Deciders: Robin
- Related PRD: docs/prd/20260212-SharedCalendar.md

## Context
本项目目标是“轻量共享日历”，核心价值在于：
- 多空间的共享状态与事件协作（Spaces + Calendar + Proposals）
- 多人实时刷新（准实时即可）
- 个人项目（开发/维护成本要低）

目前已实现：
- Next.js 前后端一体（Route Handlers）
- MongoDB 为主存储
- SSE 作为实时更新通道

后续 roadmap 涉及：重复事件、离线、附件、时区、外部预约链接等，要求我们在“轻量”的同时为扩展预留结构。

## Decision
继续采用：
1) **Next.js（App Router）+ Route Handlers** 作为 Web + API 一体化框架  
2) **MongoDB** 作为主要存储  
3) **SSE** 用于实时数据刷新（不升级为 WebSocket，除非后续出现强需求）  
并补充：
4) 引入 **ADR + C4 + Mermaid** 的 docs-as-code 文档体系，以支持迭代与回溯。

## Options Considered

### A. Next.js Route Handlers + SSE（现状）
- Pros:
  - 一体化开发：前端/后端同仓库、低运维
  - SSE 适合“单向推送 + 准实时刷新”
  - 对个人项目实现成本低
- Cons:
  - SSE 在复杂双向协作（如冲突编辑）上能力有限
  - 长连接需注意资源与断线重连策略

### B. WebSocket（如 Socket.io）
- Pros:
  - 双向通信更灵活
  - 更适合强实时协作
- Cons:
  - 运维与复杂度明显上升
  - 容易过度设计，不符合“轻量”目标

### C. 独立后端服务（NestJS/Go）+ 消息队列
- Pros:
  - 架构更标准、可扩展强
- Cons:
  - 个人项目成本过高
  - 在现阶段收益不足

## Consequences
- 短期收益：
  - 能持续快速交付 v1.2（Dashboard/Agenda/Memo/Emoji）
  - 文档与图可 review、可追溯
- 代价：
  - 需要补齐：SSE 断线重连、事件版本号/ETag、防止重复消费等策略
- 后续触发升级条件（升级到 WebSocket/独立后端）：
  - 出现高频双向协作编辑需求
  - SSE 连接资源不可控导致稳定性问题
  - 需要复杂通知/队列/离线冲突合并并达到可观规模

## References
- PRD: docs/prd/20260212-SharedCalendar.md
- Diagrams: docs/architecture/diagrams/*
