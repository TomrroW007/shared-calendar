# Shared Calendar 产品需求文档 (PRD)

- Owner: Robin
- Status: Active
- Version: v1.4 Enterprise-grade UX
- Last Updated: 2026-02-13

## 1. 项目背景与目标

### 1.1 背景
在家庭、小型团队或社交圈子中，协调多人的日程安排往往比较繁琐。现有的日历软件（如 Google Calendar, Outlook）功能强大但相对重头，且在“寻找共同空闲时间”和“非正式状态分享”方面不够轻便。

### 1.2 产品目标
打造一个轻量级的共享日历应用，专注于：
- **极速交互**：通过全局命令面板 (Cmd+K) 实现专业级的效率体验。
- **智能排程**：算法自动推荐最佳空闲时间，彻底消除决策成本。
- **状态社交**：通过 Daily Vibe 分享心情，让日程表具有社交温度。

---

## 2. 核心功能（已实现）

### 2.1 效率与交互 (New in v1.4)
- **全局命令面板 (Command Palette)**：按下 `Cmd+K` (或 `Ctrl+K`) 快速呼出搜索中心，支持极速空间跳转、首页回归、创建新空间等快捷指令。
- **智能空闲推荐 (Smart Recommendation)**：在创建日程时，一键计算空间内所有成员未来 7 天的共同空闲“黄金时段”并支持自动填充。

### 2.2 共享日历与排程 (Core)
- **多维视图切换**：支持“月视图”与垂直流式的“议程视图 (Agenda)”。
- **重复日程 (Recurring Events)**：支持日、周、月重复，并在日历上以 ↻ 标识。
- **即时冲突检测**：在创建/编辑时实时提示与个人已有日程的重叠。
- **节假日渲染**：同步中国法定节假日及调休信息（2025-2027）。

### 2.3 智能协作 (Enhanced)
- **交集热力图 (Heatmap Mode)**：多选成员时，背景颜色深度代表共同空闲比例。
- **分层详情页 (Tabbed Modal)**：详情与评论 Tab 分离，专为移动端社交优化。
- **事件讨论区 (Comments)**：每个日程关联独立聊天流。
- **空间公告板 (Memo)**：置顶显示的群组长期备忘录。

---

## 3. 下一步路线图

### 3.1 信息深度与沉淀
- **[高] 空间文件柜 (Files & Notes)**：支持在空间内沉淀图片、PDF 及 Markdown 格式的长文档，类似 Notion 知识库。
- **[中] 自然语言全解析 (NLP Quick Add)**：支持一句话创建完整日程。

### 3.2 开放社交 (Openness)
- **[高] 个人预约名片 (Booking Page)**：生成基于个人空闲状态的公共名片链接，类 Calendly。

### 3.3 系统与离线
- **[高] PWA 离线支持**：Service Worker 缓存，实现断网可用。

---

## 4. 技术栈
- **前端**：Next.js (App Router), React 19, CSS Modules
- **后端**：Next.js Route Handlers
- **数据库**：MongoDB (Atlas)
- **通信**：SSE (Real-time), WebPush (Notification)
