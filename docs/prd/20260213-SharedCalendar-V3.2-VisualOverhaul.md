# Shared Calendar PRD v3.2 - UI 视觉重构 (Visual Overhaul)

- **Project Code**: Nexus
- **Version**: v3.2 (Focus: Visual Aesthetics & Micro-interactions)
- **Status**: Design Refinement
- **Date**: 2026-02-13
- **Tech Stack**: Tailwind CSS v4, Framer Motion, React Day Picker (Headless)

## Goal

Replacing the "Admin Dashboard" look with a **"Liquid Social OS"** aesthetic.
**Key Design Concept**: Glass, Neon, & Void (玻璃、霓虹与虚空).

## 1. 核心组件重构 (Component Refactoring)

### 1.1 日历视图重构 (The Calendar Grid)

- **当前问题**: 传统的表格线框，红色的日期高亮显得像“报错”，整体僵硬。
- **新设计方案: "Star Chart" (星图布局)**
  - **移除网格线 (No Borders)**: 完全移除日历格子的边框线。
  - **日期显示**:
    - **非本月日期**: 降低透明度至 20%。
    - **今日**: 不使用方块背景，使用 **霓虹紫光晕 (Glow Effect)** 包裹数字。
    - **有事件的日期**: 日期下方显示一个微小的发光点 (Dot)，颜色对应事件类型（工作=蓝，派对=紫）。
  - **手势交互**: 在移动端，日历不是点击切换，而是可以像胶卷一样左右快速滑动。

### 1.2 弹窗/表单重构 (The Modal)

- **当前问题**: 原生的下拉框、粗糙的输入框边框、密密麻麻的标签。
- **新设计方案: "Conversational UI" (对话式界面)**
  - **背景**: 使用高强度的 **背景模糊 (Backdrop Blur-xl)**，让背后的内容隐约透出，增加层次感。
  - **输入框 (Input)**:
    - 移除所有边框 (border-none)。
    - 背景色设为 `bg-white/5` (5% 透明白)。
    - 文字放大至 `text-lg`。
    - **Focus 态**: 底部出现一条渐变的霓虹横线，而不是四周的蓝框。
  - **选择器 (Select)**:
    - 抛弃下拉列表。
    - 改为 **Pill Selector (胶囊选择器)**。例如“重复规则”，横向排列 `[不重复]` `[每天]` `[每周]`，点击高亮。

### 1.3 按钮与图标 (Buttons & Icons)

- **当前问题**: 按钮看起来像 Bootstrap 的默认样式。
- **新设计方案**:
  - **Primary Button**:
    - 渐变色: `bg-gradient-to-r from-violet-600 to-indigo-600`。
    - 光影: 增加 `shadow-[0_0_20px_rgba(139,92,246,0.5)]` (紫色外发光)。
  - **Icons**: 使用 **Phosphor Icons** 或 **Lucide React** 的 "Thin" 或 "Light" 粗细度，保持精致感。

## 2. 关键页面视觉规范 (Visual Specs)

### 2.1 首页 (Home / Pulse)

- **背景**: 引入极其微弱的 **“极光背景” (Aurora Background)**。在纯黑底色上，添加两个缓慢移动的、模糊的紫色和青色光斑 (Blob)，打破死寂的黑色。
- **字体**:
  - **标题 (Header)**: 使用 `Space Grotesk` 或 `Syne`，带一点独特的几何感。
  - **正文**: `Inter Tight`。

### 2.2 发起活动 (Spark / Create)

- **改进**:
  - **"Ignite Spark" 按钮**: 需要更有“打击感”。当用户输入文字时，按钮应该有一个 **"充能动画"** (从左到右填满颜色)。
  - **Magic Preview**: 预览卡片不要做成黑底灰框，要做成 **"全息投影" 风格**——半透明玻璃卡片，边缘有一圈 1px 的亮光。

### 2.3 颜色系统更新 (Color Palette v2)

| 颜色名称                  | Hex                         | 用途                                        |
| :------------------------ | :-------------------------- | :------------------------------------------ |
| **Void (虚空黑)**         | `#030014`                   | 全局背景 (带一点点深蓝倾向，比纯黑更有质感) |
| **Neon Plasma (电浆紫)**  | `#A855F7`                   | 主品牌色，用于按钮、高亮                    |
| **Cyber Cyan (赛博青)**   | `#22D3EE`                   | 用于 "Chill" 状态和次要高亮                 |
| **Glass Stroke (玻璃边)** | `rgba(255, 255, 255, 0.08)` | 卡片描边                                    |
| **Muted Text**            | `#94A3B8`                   | 辅助文字 (Slate-400)                        |

## 3. Tailwind 代码示例 (Refactoring Reference)

请参考以下代码重构您的卡片和输入框：

```typescript
// 1. 新版卡片容器 (Glass Card)
<div className="
  relative overflow-hidden
  bg-white/5 backdrop-blur-xl
  border border-white/10
  rounded-3xl
  p-6
  shadow-2xl
">
  {/* 内部光效装饰 */}
  <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

  {/* 内容 */}
  <h2 className="text-2xl font-bold text-white mb-4 font-display">
    发起活动
  </h2>
  {/* ... */}
</div>

// 2. 新版输入框 (Invisible Input)
<div className="group">
  <label className="text-xs text-purple-300/70 uppercase tracking-widest font-bold mb-2 block">
    活动主题
  </label>
  <input
    type="text"
    placeholder="今晚去哪儿野？"
    className="
      w-full bg-transparent
      text-xl text-white placeholder-white/20
      border-b border-white/10
      focus:border-purple-500 focus:outline-none focus:ring-0
      transition-all duration-300
      pb-2
    "
  />
</div>
```

## 4. 实施建议

- **废弃旧组件**: 彻底删除项目中现有的 `Calendar` 组件（如果是用的第三方库默认样式）。建议使用 `react-day-picker` (Headless) 自行编写样式。
- **引入 Framer Motion**: 静态的 UI 即使重构了也缺乏灵气。
  - 弹窗打开时：`scale: 0.9 -> scale: 1`, `opacity: 0 -> 1`。
  - 点击日期时：日期数字有一个微小的 spring 弹跳效果。
