# Shared Calendar V3.0 - 流动的社交生命体 (Fluid Social Organism)

- **Project Code**: Nexus
- **Version**: v3.0 (Evolution from ChronoSocial OS)
- **Status**: Drafting
- **Date**: 2026-02-13
- **Tech Stack**: Next.js 15, React 19, MongoDB (Vector Search), OpenAI/Gemini API

## 1. 深度调研与战略分析 (Strategic Research & Analysis)

在规划 V3.0 之前，我们调研了全球范围内最具创新性的社交与效率软件（如 Amie, Cron, Zenly, Locket, Notion, Discord），发现当前"共享日历"类产品的局限性与突破口。

### 1.1 全球软件趋势调研

- **Amie / Cron (Joyful Productivity)**: 日程管理不再是枯燥的列表，而是追求"愉悦感"和"游戏化"。
- **Zenly (Social Maps)**: 用户渴望知道好友的"实时状态"（在做什么、跟谁在一起），而不仅仅是未来的计划。
- **Locket / BeReal (Intimacy)**: 逃离朋友圈的表演型社交，回归小圈子的"真实互动"。
- **Notion / AI Agents**: 用户期望软件能主动通过 AI 解决冲突，而不是被动记录。

### 1.2 受众群体 (Gen Z & Millennials) 痛点画像

- **决策瘫痪 (Decision Paralysis)**: "我们要聚一下吗？" -> "好啊" -> (沉默) -> 没人定时间/地点。
- **社交压力 (Social Friction)**: 害怕发起活动被拒绝；害怕直接问"你现在有空吗"显得太唐突。
- **割裂体验 (Fragmented Experience)**: 在微信聊意向，在大众点评找店，在日历记时间，在地图发位置。链路太长导致流失。

### 1.3 战略方向与最终决策

我们为 V3.0 提出三个演进方向：

- **选项 A (The Social Executive)**: AI 助理方向，侧重效率。AI 自动扫描所有人空闲时间，自动推荐餐厅并预订。
- **选项 B (The "Live" Map)**: 地理/状态方向，侧重实时。类似 Zenly 的日历版，看到朋友正处于"无聊中"，一键召唤。
- **选项 C (Social Operating System)**: 全链路生态，侧重情感与经历。将"过去（相册）"、"现在（状态）"、"未来（计划）"打通。

👉 **最终决策**：融合选项 A 与 C，打造**"流动的社交生命体 (Fluid Social Organism)"**。不再做"日历"，而是做"未来的朋友圈"。现有的社交软件记录过去，我们要预演并创造未来。

## 2. 产品愿景 (Revised Vision)

**From "Managing Time" to "Synchronizing Lives".**

从单纯的时间管理工具，进化为智能社交伴侣。它不仅告诉你朋友什么时候有空，还能根据你们的共同喜好、天气和精力状态，主动生成聚会方案，并记录聚会后的共同回忆。

## 3. 核心颠覆性功能 (Breakthrough Features)

### 3.1 智能动态：社交电池 (Social Battery & Energy Mapping)

- **洞察**: 有时间不代表想社交。传统的"忙/闲"状态太生硬。
- **功能描述**:
  - 引入 **"Vibe Slider" (状态滑块)**：用户不仅标记时间，还标记精力值（🔥 High Energy / 🔋 Low Battery / 🧘 Need Focus）。
  - **AI 匹配**：当两个好友同时处于"无聊且高能量"状态时，系统主动推送："Hey，你们俩现在都很闲且精力充沛，要不要去隔壁新开的酒吧？"
- **价值**: 解决"有空但不想动"的无效邀约尴尬。

### 3.2 逆向日程：从"想法"到"现实" (Reverse Scheduling / The "Spark" Engine)

- **洞察**: 所有的活动都始于一个模糊的想法，而不是一个确定的时间。
- **功能描述 (升级版 Ghost Mode)**:
  - 用户不再创建 Event，而是通过 NLP 输入创建一个 **"Spark" (火花)**。例如输入："想吃火锅"。
  - **系统接管**：
    - **Who**: 自动高亮喜欢火锅且近期有空的好友。
    - **When**: 自动计算大家的交集时间（Heatmap）。
    - **Where**: 调用地图 API 推荐评分最高的火锅店。
  - **一键实例化**：发起人只需点击"Make it happen"，Spark 瞬间变为正式 Event 并发送邀请。

### 3.3 活体大厅 (The "Lobby" Before Event)

- **洞察**: 聚会不仅仅是见面的那2小时，行前的期待和行后的回味同样重要。
- **功能描述**:
  - 每个 Event 创建后，自动生成一个临时的、沉浸式的 **"Lobby" (休息室)**。
  - **倒计时 (Hype Mode)**：界面显示动态倒计时，背景随时间临近而变色。
  - **协作面板**：参与者可以在 Lobby 里投票选歌单、上传想吃的菜单图片、实时共享出发位置（类似 Uber 的车辆移动）。
- **价值**: 将单一的"日程条目"变成一个"微型社交空间"。

### 3.4 记忆回溯链 (Memory Chain)

- **洞察**: 日程结束后通常会被遗忘，我们浪费了数据的情感价值。
- **功能描述 (升级版 Time Capsule)**:
  - 活动结束后，Event 不会消失，而是变成 **"Memory Node" (记忆节点)**。
  - **关联性**：当你再次计划和 User A 吃饭时，系统提示："上次你们去吃日料已经是 3 个月前了，当时你们聊得很开心（基于用户上传的 Note/Photo）"。
  - **Streak**：建立与好友的"见面连续技"，例如"连续 5 周周末聚会达成"，增加游戏化黏性。

## 4. UI 原型与交互设计 (UX/UI Guidelines)

**设计核心理念：Liquid Interface (流体界面)。**
告别传统日历的网格（Grid）限制，采用圆角、卡片堆叠和动态模糊（Blur）效果，打造一种"有机生命体"的视觉感受，强调状态的流动而非时间的分割。

### 4.1 全局设计规范 (Design System - Hotfix 20260213)

- **核心原则**: 在纯黑背景 (#050505) 上，灰度文本亮度绝对不低于 40% (Zinc-400)。
- **配色 (Color Palette)**:
  - **背景 (Background)**: Deep Void (#050505)。
  - **主标题 (Primary Text)**: Zinc-100 (#EDEDED)。
  - **次级文案 (Body)**: Zinc-400 (#A1A1AA) - 关键修复色。
  - **辅助文案 (Muted)**: Zinc-500 (#71717A) - 用于时间轴、输入提示。
  - **主按钮 (Primary Action)**: Bg: #B692F6 (Neon Lavendar), Text: #000000 (极高对比度)。
  - **次级按钮 (Ghost/Card)**: Zinc-900 背景，带 Zinc-800 边框。
- **字体**: Inter (系统UI)。
- **物理材质**: 玻璃拟态 (Glassmorphism) 仅用于特定浮层，增强对比而非降低可见度。

### 4.2 核心界面流程 (Key Screen Flows)

#### A. 首页：The "Pulse" (脉搏大厅)

取代传统的月视图，通过实时状态展示社交圈的"生命力"。

- **顶部区域 (My Vibe)**:
  - **元素**: 一个横向滑动的 "Vibe Slider" (状态滑块)。
  - **交互**: 用户手指左右滑动。
    - 左端：🔋 "仅限紧急 (Low Battery)" - 只有置顶好友能看到我。
    - 中间：☕ "开放闲聊 (Open)" - 正常状态。
    - 右端：🔥 "来嗨！(Hype Mode)" - 头像周围出现动态光环，推送到好友首页顶部。
  - **文案**: 滑动时，上方文案动态变化："I need space" -> "Up for coffee" -> "Let's rage".
- **中心区域 (Social Heatmap)**:
  - **布局**: 只有今天和明天的"时间流" (Timeline)。
  - **视觉**: 好友的头像不是静止的，而是根据其空闲时间段，像气泡一样漂浮在对应的时间轴上。
  - **Ghost Event 展示**: 虚线框的气泡，内部文字模糊，显示"User A 想吃..."。点击出现"感兴趣"按钮。
- **底部导航 (Floating Dock)**:
  - 悬浮胶囊设计，包含三个图标：Pulse (首页), Spark (创建), Memories (回忆).

#### B. 创建页：Spark Engine (火花引擎)

取代复杂的表单填写，采用对话式输入。

- **入口**: 点击底部巨大的 + 按钮 (Spark Icon)。
- **交互**:
  - **输入层**: 键盘弹起，输入框上方只有一句提示："What's the vibe?" (想干嘛？)
  - **智能联想 (Magic Text)**:
    - 用户输入: "下周五晚上吃火锅"
    - UI 实时反馈: 关键词高亮。
      - "下周五晚上" -> 自动检索 User A, B, C 的空闲交集，显示一个小气泡 "3人有空"。
      - "火锅" -> 底部卡片滑出 3 家高分火锅店推荐。
- **Ghost Toggle**: 输入框旁有一个 👻 开关。开启后，发布的不是正式邀请，而是"意向试探"。
- **Action**: 按钮不是 "Create Event"，而是 "Ignite Spark" (点燃火花)。

#### C. 活动详情页：The Lobby (动态休息室)

活动开始前的沉浸式等待空间。

- **Header (Atmosphere)**:
  - **动态背景**: 根据活动类型（如"滑雪"）自动拉取 Unsplash 高清图作为背景，并覆盖动态天气特效（如飘雪动画）。
  - **倒计时**: 巨大的数字倒计时 "02 Days : 14 Hrs"，随着时间临近，字体变粗、颜色变红。
- **功能卡片区 (Widgets Grid)**:
  - **协作歌单**: 显示 Spotify/Apple Music 插件，参与者可添加路上的歌。
  - **Carpool (拼车)**: 显示"谁开车？"，用户拖动自己的头像到司机的车里。
  - **Menu Poll**: 或者是"带酒水"清单，采用 Checklist 形式，勾选有震动反馈。
- **底部 Chat**: 半透明的聊天遮罩层，永远悬停在底部 30% 区域，支持快速发表情。

#### D. 回忆页：Memory Chain (时光链)

社交资产的沉淀。

- **布局**: 垂直的时间轴 (Timeline)，但连接线是彩色的 DNA 螺旋状。
- **节点 (Memory Node)**:
  - 每次结束的 Event 变成一个卡片。
  - **封面**: 系统自动将大家在 Lobby 里上传的照片拼成 Collage (拼贴画)。
  - **数据标签**: 显示 "3h duration", "High Energy", "User A paid".
- **交互**: 长按某个节点，系统高亮显示与这群人的"连续打卡记录" (Streak: 4 weeks in a row!)。

### 4.3 微交互与动效 (Micro-interactions)

- **Haptic Touch (触感)**:
  - 当手指滑过 Timeline 上的空闲时间段时，手机轻微震动，模拟"卡槽"的感觉。
  - 点击 "Interested" (感兴趣) 时，按钮会有类似心脏跳动的缩放效果。
- **Loading States (骨架屏)**:
  - AI 计算最佳时间时，不要用旋转菊花，而是用"头像互相碰撞、融合"的动画，暗示系统正在撮合大家的时间。
- **Transitions**:
  - 使用 Shared Element Transitions (React 19 / Framer Motion)。
  - 点击首页的"Ghost Event"气泡，气泡不消失，而是直接展开变成"Lobby"页面的背景，实现无缝衔接。

## 5. 技术架构演进 (Technical Evolution)

为了支撑上述功能，需在现有 Next.js + MongoDB 架构上进行升级：

- **AI Layer (Brain)**:
  - 接入 LLM (如 OpenAI/Gemini) 用于解析自然语言 (Creating Sparks) 和 推荐算法 (Energy Mapping)。
  - 使用 MongoDB Vector Search：将用户的兴趣、历史活动向量化，实现"猜你想玩"。
- **Real-time Interaction (Nervous System)**:
  - 强化 SSE (Server-Sent Events) 或迁移至 WebSocket (Socket.io) 以支持"Lobby"内的实时位置共享和打字状态。
- **Integration (Limbs)**:
  - **Maps API**: Google Maps / Mapbox 用于地点推荐。
  - **Weather API**: 聚会当天下雨自动预警并建议室内活动。
- **UI/UX Stack**:
  - **CSS**: Tailwind CSS + `backdrop-filter: blur()`.
  - **Layout**: CSS Grid / Flexbox + `overflow-x: scroll`.
  - **Updates**: Optimistic updates (乐观更新) 策略。

## 6. 路线图 (Roadmap)

- **Phase 1 (v2.1)**: 上线 "Social Battery" (状态滑块) 和 基础 NLP 输入。
- **Phase 2 (v2.5)**: 发布 "Spark Engine" (模糊意向转化) 和 桌面 Widget。
- **Phase 3 (v3.0)**: 推出 "Lobby" (活动前中后全流程空间) 和 记忆回溯系统。

## 总结 (Conclusion)

V3.0 的核心在于 **"上下文 (Context)"**。市面上的日历只有 Time 和 Title，而 Shared Calendar V3.0 拥有 Emotion (精力状态)、Intent (模糊意向) 和 Memory (历史数据)。这将彻底改变用户组织生活的方式。
