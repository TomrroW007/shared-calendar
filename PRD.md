# Shared Calendar 产品需求文档 (PRD)

- Owner: Robin
- Status: Active
- Version: v1.5 Mobile-First Excellence
- Last Updated: 2026-02-13

## 1. 项目背景与目标

### 1.1 背景
在家庭、小型团队或社交圈子中，协调多人的日程安排往往比较繁琐。现有的日历软件（如 Google Calendar, Outlook）功能强大但相对重头，且在“寻找共同空闲时间”和“非正式状态分享”方面不够轻便。

### 1.2 产品目标
打造一个轻量级的共享日历应用，专注于：
- **移动端原生体验**：通过底部导航与 FAB，提供丝滑的手机端操作感受。
- **智能辅助**：算法推荐空闲时间，Cmd+K 极速指令。
- **状态社交**：通过 Daily Vibe 分享心情，让日程表具有社交温度。

---

## 2. 核心功能（已实现）

### 2.1 移动端原生化 (New in v1.5)
- **底部导航栏 (Bottom Nav)**：持久化菜单（首页、空间、通知、账户），对标主流移动应用交互。
- **悬浮操作按钮 (FAB)**：在首页与空间页提供快速创建入口，极大提升单手操作效率。
- **iOS/Android 适配**：自动适配底部 Safe Area，优化移动端网格密度。

### 2.2 效率与交互
- **全局命令面板 (Command Palette)**：按下 `Cmd+K` 快速搜索跳转，专业级效率工具。
- **智能空闲推荐 (Smart Recommendation)**：一键计算全员未来 7 天共同空闲“黄金时段”。

### 2.3 共享日历与排程 (Core)
- **多维视图切换**：支持“月视图”与垂直流式的“议程视图 (Agenda)”。
- **重复日程 (Recurring Events)**：支持日、周、月重复，并在日历上以 ↻ 标识。
- **即时冲突检测**：实时提示个人日程重叠。
- **节假日渲染**：同步中国法定节假日及调休信息（2025-2027）。

### 2.4 智能协作 (Enhanced)
- **交集热力图 (Heatmap Mode)**：多选成员时，背景深度代表共同空闲比例。
- **分层详情页 (Tabbed Modal)**：详情与评论 Tab 分离，专为移动端社交优化。
- **事件讨论区 (Comments)**：每个日程关联独立聊天流。

---

## 3. 下一步路线图

### 3.1 信息深度与沉淀
- **[高] 空间文件柜 (Files & Notes)**：支持在空间内沉淀图片、PDF 及 Markdown 长文档。
- **[中] 自然语言全解析 (NLP Quick Add)**：支持一句话创建完整日程。

### 3.2 开放社交 (Openness)
- **[高] 个人预约名片 (Booking Page)**：生成基于个人空闲状态的公共预约名片。

### 3.3 系统与离线
- **[高] PWA 离线支持**：Service Worker 缓存，实现断网可用。

---

## 4. 技术栈
- **前端**：Next.js (App Router), React 19, CSS Modules
- **后端**：Next.js Route Handlers
- **数据库**：MongoDB (Atlas)
- **通信**：SSE (Real-time), WebPush (Notification)
