# Shared Calendar PRD v3.4 - Pulse Radar v2.0 (星际雷达)

- **Project Code**: Nexus (Nebula Edition)
- **Version**: v3.4 (Focus: Pulse Timeline 彻底重构)
- **Status**: Implementation
- **Date**: 2026-02-14
- **Predecessor**: v3.3 Cosmic HUD (保留其设计系统中色彩/字体/变量的全部规范)
- **Tech Stack**: Next.js 15, Vanilla CSS (globals.css), Framer Motion

## 核心设计理念

### "Tactical Data Stream" (战术情报流)

彻底摒弃当前"大色块日程表"的设计。Pulse 页面应该是一个**精密、线性、高密度信息流**。
核心美学原则：**细线条、高密度信息、透明感**——星际终端，而非儿童应用。

## 1. 问题分析 (Critique)

| 问题                     | 原因                                                                                   | 影响                           |
| :----------------------- | :------------------------------------------------------------------------------------- | :----------------------------- |
| **大色块廉价感**         | Timeline 被包裹在 `CosmicCard` 内，形成巨大的紫蓝渐变方块，占据 70% 屏幕却无信息       | 像未加载完的 PPT                |
| **失去 HUD 精致感**      | 大圆角、粗字体、实心块的组合偏离了科幻 HUD 风格                                          | 看起来像普通儿童应用            |
| **空间浪费**             | 0:00–4:00 等空闲时段占据大量空间，展示一片虚空                                          | 关键信息被挤到需要滚动的位置    |

## 2. 重构方案

### 2.1 The Time Beam (光束时间轴)

**移除**: 占据整个屏幕的 CosmicCard 紫色背景盒子。

**新增**: 一条贯穿屏幕**左侧**的增强型发光能量束（垂直方向）。

- **光束结构**: 3px 宽的渐变光束 + 15px 宽的环境辉光带 (Ambient Halo)，形成"能量管道"视觉
- **布局**: 从水平横向滚动 → 改为**垂直信息流**
- **时间刻度**: 挂在光束左侧，带 4 级刻度点层级：
  - `beam-tick-dim` (5px): 压缩空闲段的暗淡点
  - `beam-tick-empty` (5px): 单独空闲小时的微弱青色点
  - `beam-tick-event` (8px): 有事件的紫色发光点
  - `beam-tick-now` (10px): 当前时间点，带呼吸动画
- **虚线连接器 (Dashed Connector)**: 水平虚线将光束上的刻度点与右侧的数据卡片物理连接，形成完整的视觉通路
- **数据节点 (Data Nodes)**: 好友的活动像"数据舱"一样挂在光束右侧，通过虚线连接
- **NOW 标记**: 当前时间点右侧显示 `NOW` 发光徽章
- **智能压缩**: 连续空闲时段被压缩为一行 (e.g. `00:00 — 06:00 · 6h 空闲`)
- **空状态 — 雷达扫描动画**: 若当天无任何事件，展示一个 `SCANNING FREQUENCIES...` 动画卡片（带扫描条 CSS 动画），取代空白虚空

### 2.2 Frequency Header (频率顶栏)

**移除**: 顶部孤零零的绿色方块头像 + 纯文字标题。

**新增**:
- 标题保持 "PULSE RADAR"，但以更紧凑的 HUD 方式排列
- 用户头像改为**六边形轮廓**或带发光描边的小型头像，置于标题行右侧
- 副标题使用 tech 字体的扫描线文字效果

### 2.3 Holo-Dock (全息底座)

**移除**: 底部导航的纯黑背景。

**新增**:
- 底栏使用更强的玻璃态效果 (`backdrop-filter: blur(20px)`)
- 顶部边框改为连续的渐变发光线
- 选中图标增加径向辉光 (Radial Glow)
- 整体上移，增加 `safe-area-inset-bottom` 支持

## 3. 技术实现规范

### 3.1 PulseTimeline.js — 垂直时间光束

```
布局结构:
┌──────────────────────────────┐
│  TIME  │ ─── beam ─── │ DATA NODE │
│  06:00 │      ●        │ [Avatar] Title  │
│  07:00 │      │        │                 │
│  ...   │      │        │                 │
│  NOW → │  ●●● ● ●●●   │ [Avatar] Title  │
│  ...   │      │        │                 │
└──────────────────────────────┘
```

**关键 CSS 变量 (新增到 globals.css)**:
```css
--beam-color: rgba(6, 182, 212, 0.6);       /* 光束颜色 (Cyan) */
--beam-glow: 0 0 8px rgba(6, 182, 212, 0.4); /* 光束发光 */
--node-bg: rgba(255, 255, 255, 0.04);        /* 数据节点背景 */
--node-border: rgba(6, 182, 212, 0.2);       /* 数据节点边框 */
```

**光束线的 CSS 实现**:
```css
.time-beam {
  position: absolute;
  left: 48px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--beam-color) 10%,
    var(--beam-color) 90%,
    transparent 100%
  );
  box-shadow: var(--beam-glow);
}
```

**数据节点的样式**:
```css
.data-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-left: 64px;   /* 光束右侧 */
  background: var(--node-bg);
  border: 1px solid var(--node-border);
  border-radius: 12px;
  transition: all 0.2s;
}

.data-node:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--cosmic-cyan);
  box-shadow: var(--beam-glow);
}
```

### 3.2 智能时间压缩逻辑

```javascript
// 将 24 小时分组：有事件的小时单独显示，连续空闲小时压缩
function compressTimeline(events, hours) {
  const result = [];
  let emptyStart = null;

  for (const hour of hours) {
    const hasEvents = events.some(e => getHour(e) === hour);
    if (hasEvents) {
      if (emptyStart !== null) {
        result.push({ type: 'gap', from: emptyStart, to: hour - 1 });
        emptyStart = null;
      }
      result.push({ type: 'hour', hour, events: getEventsAt(hour) });
    } else {
      if (emptyStart === null) emptyStart = hour;
    }
  }
  if (emptyStart !== null) {
    result.push({ type: 'gap', from: emptyStart, to: 23 });
  }
  return result;
}
```

### 3.3 BottomNav.js — Holo-Dock 增强

```css
.mobile-bottom-nav {
  background: rgba(3, 0, 20, 0.7);
  backdrop-filter: blur(20px);
  border-top: 1px solid transparent;
  border-image: linear-gradient(
    90deg, transparent, var(--accent-cyan), var(--accent-primary), transparent
  ) 1;
}
```

## 4. 文件修改清单

| 文件 | 操作 | 说明 |
| :--- | :--- | :--- |
| `components/PulseTimeline.js` | **重写** | 水平滚动 → 垂直光束时间轴，智能时段压缩 |
| `app/page.js` | **修改** | 移除 CosmicCard 包裹，重构顶部 header 布局 |
| `components/BottomNav.js` | **修改** | 增强玻璃态效果，渐变发光顶部边框 |
| `app/globals.css` | **新增规则** | time-beam、data-node、holo-dock 相关样式 |

## 5. 验收标准

- [ ] Timeline 区域不再出现大色块背景
- [ ] 左侧有一条清晰的垂直发光线（光束）
- [ ] 空闲时段被压缩，不浪费屏幕空间
- [ ] 有活动时，数据节点以 HUD 卡片形式展示在光束右侧
- [ ] 没有活动时，界面仍有光束骨架，不出现大面积空白
- [ ] 底部导航具有明显的玻璃态和发光边框效果
- [ ] 移动端和桌面端均可正常显示
- [ ] `npm run dev` 构建无报错

## 6. 风险与注意事项

- **数据兼容性**: 事件数据结构不变，仅改变展示方式
- **性能**: 垂直布局比水平滚动更省资源（无需 overflow-x: auto）
- **渐进式**: 本次仅重构 Pulse 页面，其他页面保持 v3.3 设计不变
