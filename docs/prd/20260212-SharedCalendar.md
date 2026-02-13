# Shared Calendar 产品需求文档 v1.2

## 背景与目标

### 1.1 背景
[原内容保留]

### 1.2 目标
[原内容保留]

## 用户与使用场景

建议补充 3 个 Top 场景：
- 家庭协调
- 小队活动
- 临时聚会

## 范围定义

### 3.1 已实现（Current）

核心功能已实现：
- [功能列表]

### 3.2 下一个版本 v1.2（Committed）

Dashboard/Agenda/Memo/Emoji 计划：
- [功能列表]

### 3.3 Backlog（Future / Research）

调研阶段的高/中/低优先级功能：
- [功能列表]

### 3.4 非目标（Non-goals）

- 不做完整企业级日历替代
- 不做复杂资源预定
- [其他非目标]

## 关键体验与流程

对应输出：flow-activity.md、sequence-sync.md

## 权限与隐私模型

### 权限等级

- Admin：空间创建者，拥有完全权限
- Member：成员，可创建事件和投票

### 隐私可见性

- **公开**：其他成员可以看到状态和事件细节
- **私人（仅忙碌）**：其他成员仅可看到忙碌占用，不展示细节
- **仅状态**：其他成员可看到状态但不展示事件细节

## 通知与实时性策略

### SSE 实时同步

采用 Server-Sent Events 实现准实时同步：
- **刷新语义**：状态变化立即推送
- **断线重连**：自动重新连接
- **消息一致性**：确保消息不重复消费

## 验收标准（概览）

详见 docs/testing/acceptance-criteria.md

主要验收点：
- 匿名注册与持久化
- Space 创建与邀请码加入
- 月视图与隐私可见性
- 提案投票与日期确认
- SSE 准实时刷新

## 指标（Metrics）

- 空间周活（WAU）
- 提案转化率（%）
- 投票参与率（%）
- SSE 同步延迟分位数（P95）

## 风险与开放问题

- SSE 大规模并发扩展性
- 离线能力与一致性合并
- 重复事件编辑语义设计
- 国际化时区边界处理

## 技术方案摘要

### 当前技术栈

- **前端**：React + Next.js App Router
- **后端**：Next.js Route Handlers
- **数据存储**：MongoDB
- **实时通信**：Server-Sent Events (SSE)
- **认证**：JWT + localStorage
- **UI 组件**：原生 HTML + CSS

### 关键约束

- 项目为个人维护，强调"轻量+可维护"
- 技术选型优先考虑开发效率低于企业级完美度
- 详细技术决策见 ADR 文档（docs/adr/）

## 关联文档

- ADR：docs/adr/ADR-0001-DecisionOnCalendarTech.md
- 架构图：docs/architecture/diagrams/
- 测试标准：docs/testing/acceptance-criteria.md
- 术语表：docs/glossary.md
