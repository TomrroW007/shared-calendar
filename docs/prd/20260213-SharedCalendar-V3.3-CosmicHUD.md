# Shared Calendar PRD v3.3 - Cosmic HUD (宇宙全息重构版)

- **Project Code**: Nexus (Nebula Edition)
- **Version**: v3.3 (Focus: Cosmic HUD Interface)
- **Visual Target**: Golden Sample (宇宙全息界面参考图)
- **Status**: Implementation
- **Date**: 2026-02-13
- **Tech Stack**: Next.js 15, Tailwind CSS v4, Framer Motion, SVG Filters

## Core Concept

### "Interface as a Portal" (界面即传送门)

该设计风格定义为 "Cosmic HUD"：强调深邃的太空背景、高科技的玻璃面板、霓虹光效以及电路纹理。彻底抛弃传统的 SaaS 软件外观，打造一款沉浸式的"星际社交终端"。

## 1. 视觉设计语言：The Cosmic System

### 1.1 全局背景 (The Void)

不再使用纯黑或纯灰背景。

- **实现**: 全局固定背景 (`fixed inset-0`)。
- **材质**: 高清深空星云图 (Deep Space Nebula) + 缓慢旋转的星空粒子动画。
- **遮罩**: 在背景图之上覆盖一层 20% 透明度的深蓝滤镜 (`bg-slate-950/20`)，保证文字可读性。

### 1.2 容器风格 (Tech-Glass Card)

所有内容容器（卡片、弹窗）必须遵循以下 HUD 规范：

- **玻璃态**: 高强度模糊 (`backdrop-filter: blur-xl`)。
- **边框**: 使用 **渐变边框 (Gradient Border)** 模拟光线折射。
  - CSS: `border: 1px solid rgba(255, 255, 255, 0.1)` + 局部高亮。
- **纹理 (Circuit Overlay)**: 卡片表面需覆盖一层微弱的 SVG 电路板纹理或科技线条，透明度 5%。
- **内发光**: `box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.1)` (紫色内发光)。

### 1.3 色彩与光效 (Neon Palette)

| 用途               | 颜色                                                        | Hex/Tailwind        |
| :----------------- | :---------------------------------------------------------- | :------------------ |
| **主色 (Primary)** | Cyber Grape to Electric Blue 渐变                           | #8B5CF6 → #3B82F6   |
| **高亮 (Glow)**    | Cyan 用于强调文字或选中状态                                 | #06B6D4             |
| **标题**           | 纯白 + 外发光 `text-shadow: 0 0 10px rgba(255,255,255,0.5)` | #FFFFFF             |
| **正文**           | 冰蓝灰                                                      | #E2E8F0 (slate-200) |
| **输入框文字**     | 亮白                                                        | #FFFFFF             |

## 2. 核心界面重构 (UI Overhaul)

### 2.1 登录/欢迎页

- **Logo**: 位于屏幕中央上方，带旋转光环动画。
- **Input Field (输入框)**:
  - 背景: 深黑玻璃 (`bg-black/30`)。
  - 特效: 获得焦点 (Focus) 时，边框变为 **青色 (Cyan)** 并产生"呼吸"光效。
  - 文字: 纯白，字号 18px，字母间距微宽 (`tracking-wide`)。
- **Button (主按钮)**:
  - 形状: 胶囊型 (Full Rounded)。
  - 填充: 紫-蓝线性渐变。
  - 光晕: 极其强烈的底部投影 `shadow-[0_0_30px_#8B5CF6]`。
  - 内部: 顶部增加一道高光 (Shine)，模拟玻璃质感。

### 2.2 首页：Pulse Timeline (星际时间流)

**旧版问题**: 垂直线条太枯燥。

**新版设计**:

- **时间轴**: 改为一条 **发光的能量束** (垂直渐变线)，从上至下贯穿屏幕。
- **时间刻度**: 不再是数字，而是像飞船仪表盘上的刻度线 (Ticks)。
- **好友状态**: 头像不仅仅是圆圈，而是被 **六边形 (Hexagon)** 或 **全息圆环** 包裹。
  - **High Energy**: 头像周围有火焰粒子特效。
  - **Ghost Mode**: 头像变成半透明的全息投影风格 (Hologram blue)。

### 2.3 日历视图：Holographic Grid (全息网格)

**旧版问题**: 像 Excel 表格。

**新版设计**:

- **网格**: 移除所有实线边框。使用 **点阵 (Dot Matrix)** 标记日期交叉点。
- **当前日期**: 一个悬浮的 **发光方块 (Glowing Cube)** 背景。
- **选中态**: 点击某一天时，产生类似"雷达扫描锁定"的缩放动画。

## 3. 技术实现指南 (Developer Specs)

### 3.1 Tailwind Config (tailwind.config.ts)

扩展颜色和阴影以支持"霓虹感"。

```typescript
theme: {
  extend: {
    backgroundImage: {
      'cosmic-gradient': 'linear-gradient(to bottom, #0f172a, #312e81, #0f172a)',
      'glass-panel': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
    },
    boxShadow: {
      'neon-purple': '0 0 5px theme("colors.purple.500"), 0 0 20px theme("colors.purple.700")',
      'neon-cyan': '0 0 5px theme("colors.cyan.400"), 0 0 20px theme("colors.cyan.600")',
      'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.2)',
    },
    fontFamily: {
      orbitron: ['var(--font-orbitron)', 'sans-serif'],
    },
  }
}
```

### 3.2 核心组件代码：Cosmic Card (卡片容器)

```tsx
// components/CosmicCard.tsx
export default function CosmicCard({ children, className }) {
  return (
    <div className={`relative group ${className}`}>
      {/* 1. 动态流光边框 (Animated Border Gradient) */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200 animate-tilt"></div>

      {/* 2. 主体容器 (Main Glass) */}
      <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden">
        {/* 3. 电路纹理覆盖 (Circuit Overlay) - 可使用 SVG 背景图 */}
        <div className="absolute inset-0 opacity-10 bg-[url('/circuit-pattern.svg')] pointer-events-none" />

        {/* 4. 角落装饰 (HUD Corners) */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-400/50 rounded-br-lg" />

        {/* 内容 */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
```

### 3.3 核心组件代码：Neon Input (输入框)

```tsx
<input
  type="text"
  className="
    w-full bg-slate-950/50
    border border-white/10 rounded-xl px-5 py-4
    text-white text-lg tracking-wider
    placeholder-slate-500
    shadow-inner
    focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.4)]
    transition-all duration-300
  "
  placeholder="Enter Identity..."
/>
```

## 4. 资源需求 (Assets)

- **背景图**: 需要一张高质量的"Galaxy/Nebula"图片。
  - 推荐搜索: Unsplash "Deep Space", "Cyberpunk City", "Purple Nebula"。
- **字体**: 引入 **Orbitron** (标题) 和 **Rajdhani** (副标题/数字)，增加科技感。
- **图标**: 使用 Lucide-React，颜色设置为 `text-cyan-400` (青色) 或 `text-purple-400`。

## 5. 适配策略 (Responsiveness)

- **PC 端 (Desktop)**: 背景图固定不动，内容卡片悬浮在中央。
- **移动端 (Mobile)**:
  - 移除复杂的"流光边框"以节省电量。
  - 背景图变暗 (Darken)，确保强光下户外可见。
  - 卡片宽度 `w-full`，贴底或居中。

## 6. 实施计划

### Phase 1: 基础设施（本阶段）

- [x] 更新 `globals.css` 引入宇宙背景
- [x] 扩展 Tailwind 配置增加霓虹光影
- [x] 创建 `CosmicCard` 组件
- [x] 创建 `NeonInput` 组件
- [x] 更新 Layout 引入科技字体

### Phase 2: 页面重构

- [ ] 重构登录页为 Cosmic HUD 风格
- [ ] 重构首页 Pulse Timeline
- [ ] 重构日历 Holographic Grid
- [ ] 重构 EventModal 为玻璃卡片

### Phase 3: 微交互与动画

- [ ] 添加 Framer Motion 动画
- [ ] 实现呼吸光效
- [ ] 实现雷达扫描选中动画
- [ ] 添加粒子特效（可选）

## 7. 自测验收

- [ ] 背景星空在所有页面固定不动
- [ ] 所有卡片具有玻璃态模糊效果
- [ ] 输入框 focus 时出现青色光晕
- [ ] 按钮具有紫色外发光
- [ ] 移动端性能良好（无卡顿）
- [ ] 文字在深色背景下清晰可读

## 8. 风险与注意事项

- **性能风险**: `backdrop-filter` 在低端设备可能卡顿，移动端可考虑降级。
- **可读性**: 深空背景可能影响文字可读性，需要测试多种光线环境。
- **浏览器兼容性**: Safari 对某些 CSS 滤镜支持有限，需要 fallback。
