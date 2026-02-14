# Shared Calendar PRD v3.1 - 全平台适配专项升级 (Omni-Platform Update)

- **Project Code**: Nexus
- **Version**: v3.1 (Focus: Responsive Design & Cross-Platform UX)
- **Status**: High Priority Fix
- **Date**: 2026-02-13
- **Tech Stack**: Next.js 15, Tailwind CSS (v4), React Aria (Accessibility)

## 1. 核心适配策略 (Adaptation Strategy)

### 问题诊断

当前 v3.0 过度依赖移动端逻辑（Bottom Sheet, Touch Events），导致在大屏幕（PC Web）上内容过于稀疏、居中对齐失效、交互逻辑（如滑动）在鼠标操作下体验极差。

### 解决方案

采用 **"Progressive Disclosure" (渐进式展示)** 和 **"Input-Aware" (输入感知)** 策略。

- **Mobile (Touch)**: 沉浸式、单列流、手势操作。
- **Desktop (Mouse/Keyboard)**: 信息密度提升、多列布局、快捷键驱动。

## 2. 响应式布局规范 (Responsive Layout Specs)

利用 Tailwind CSS 的断点系统，定义三种视口行为：

| 维度                   | Mobile (< 640px)              | Tablet (640px - 1024px)    | Desktop (> 1024px)                   |
| :--------------------- | :---------------------------- | :------------------------- | :----------------------------------- |
| **导航 (Nav)**         | Bottom Tab Bar (底部悬浮胶囊) | Side Rail (侧边缩略图标栏) | Expanded Sidebar (左侧完整侧边栏)    |
| **主容器 (Container)** | 100% Width, 无边距            | 80% Width, 居中卡片        | 100% Height, 多面板分栏 (Split View) |
| **创建入口 (Spark)**   | 底部 FAB 按钮                 | 顶部右上角按钮             | Cmd+K 全局命令面板                   |
| **视图模式 (View)**    | 垂直单日时间流 (Timeline)     | 垂直 3 日视图              | 周视图 (Week Grid) / 仪表盘          |

## 3. 核心功能的多端差异化设计

### 3.1 首页：The Pulse (脉搏大厅)

- **Mobile (手机端)**:
  - 保持 v3.0 设计：单列垂直流。
  - Header: Vibe Slider 占据顶部。
  - Scroll: 只有 Y 轴滚动。

- **Desktop (PC 端) - 重构重点**:
  - **布局**: 三栏式布局 (3-Column Layout)。
    - **Left (250px)**: 侧边导航 + 迷你月历 (Mini Calendar)。
    - **Center (Flex-1)**: 主视图。不再使用垂直单列，改为 "Pro Dashboard"。横向展示未来 5-7 天，或以网格形式展示。
    - **Right (300px)**: "Social Radar" (实时动态栏)。将 Mobile 顶部的 Vibe Slider 移至此处，竖向排列好友列表及其当前电量。
  - **Vibe Slider 适配**:
    - 鼠标难以精准“滑动”。
    - PC 交互: 改为 "Click-to-Set" (点击设定) 的分段式开关 (Segmented Control)。

### 3.2 创建：Spark Engine (火花引擎)

- **Mobile**:
  - 全屏覆盖 (Full Screen Overlay) 或 底部弹窗 (Bottom Sheet)。
  - 依赖软键盘输入。

- **Desktop - 重构重点**:
  - **形态**: Command Bar (类似 Spotlight/Raycast)。
  - **触发**: 页面中心弹出的模态框 (Modal)，背景高斯模糊。
  - **快捷键**: 按下 `C` 或 `Cmd+K` 直接唤醒。
  - **输入**: 输入框更长，支持 `Tab` 键在“时间”、“人物”、“地点”之间快速切换，无需 AI 猜也能手动修正。

### 3.3 详情页：The Lobby (活体大厅)

- **Mobile**:
  - 堆叠式卡片 (Stack)。上层是倒计时，下滑查看地图和 Widget。

- **Desktop - 重构重点**:
  - **布局**: Bento Grid (便当盒网格) 布局。
    - 左侧大图：显示氛围背景和倒计时。
    - 右上：地图/位置信息。
    - 右下：聊天室 (Chat) 常驻展开，无需点击弹出。
  - **拖拽**: 支持鼠标直接将 Spotify 歌曲链接拖入 Lobby 区域自动解析。

## 4. 交互与输入适配 (Interaction & Input)

### 4.1 鼠标 vs 触摸 (Hover vs Touch)

- **Hover Effects (仅 PC)**:
  - 当鼠标悬停在时间块上时，显示具体的“开始/结束时间”提示 (Tooltip)。
  - 按钮增加 Hover 态（背景色加深/发光），提升点击欲望。

- **Touch Targets**:
  - **Mobile**: 最小点击区域 44px。
  - **Desktop**: 可以更紧凑 (32px)，提高信息密度。

### 4.2 滚动行为 (Scrolling)

- **PC 端痛点修复**: 当前 PC 网页可能因为 `overflow: hidden` 设置不当导致无法滚动。
- **修正**:
  - 确保 PC 端主内容区域 (`<main>`) 拥有明确的高度 (`h-screen` 或 `calc(100vh - header)`) 和 `overflow-y: auto`。
  - 自定义滚动条样式 (Custom Scrollbar)，使其在深色模式下更优雅，不突兀。

## 5. 技术实施指南 (Technical Implementation)

### 5.1 Tailwind CSS 配置更新

使用 Tailwind 的工具类强制区分样式：

```typescript
// 示例：导航栏组件
export default function NavBar() {
  return (
    <>
      {/* Mobile Nav: 底部固定 */}
      <nav className="fixed bottom-0 w-full h-16 bg-black/80 backdrop-blur md:hidden">
        {/* Mobile Items */}
      </nav>

      {/* Desktop Nav: 左侧固定 */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-white/10 p-4">
        {/* Desktop Items & Logo */}
      </aside>
    </>
  );
}
```

### 5.2 组件库选择 (建议)

为了快速修复 PC 端适配，建议引入 UI 组件库的响应式原语：

- **Shadcn/UI**: 使用其 Sheet (Mobile) 和 Dialog (Desktop) 来区分弹窗体验。
- **Resizable Panels**: 在 Desktop 端使用 `react-resizable-panels` 实现可拖拽调整宽度的侧边栏。

### 5.3 紧急修复清单 (Hotfix Checklist)

在开发 v3.1 完整版前，优先修复导致不可用的 Bug：

- [ ] **Global CSS**: 移除 `body { overflow: hidden }`，除非是在移动端打开 Modal 时。
- [ ] **Container**: 给 PC 端最外层包裹一个 `max-w-screen-xl mx-auto`，防止内容在大屏上无限拉伸。
- [ ] **Flexbox**: 检查所有 `flex-col`，在 `md:` 断点后是否需要转为 `flex-row`。

## 6. 总结 (Conclusion)

Nexus v3.1 不再只是一个“被放大的手机 App”。

- 在 **手机** 上，它是你的 **随身伴侣**（快速查看、状态同步）。
- 在 **PC** 上，它是你的 **社交指挥塔**（全局规划、复杂决策、沉浸式回顾）。

通过区分 Mobile (On-the-go) 和 Desktop (Sit-down) 的使用场景，我们将彻底解决网页端显示不全的问题。
