# ADR-0002: 采用 Cosmic HUD 视觉系统

- **Status**: Accepted
- **Date**: 2026-02-13
- **Deciders**: Design Team, Product Team
- **Related PRD**: docs/prd/20260213-SharedCalendar-V3.3-CosmicHUD.md

## Context（背景）

Shared Calendar v3.2 使用了"Liquid Social OS"风格，具有 Aurora 极光背景和玻璃态 UI。虽然已经脱离了传统 SaaS 外观，但在用户测试中发现：

1. **缺乏独特性**: 极光背景在市场上已较为常见（Stripe、Linear 等产品也在使用类似风格）
2. **品牌识别度低**: 用户难以在第一眼形成强烈的品牌印象
3. **沉浸感不足**: 对于"朋友间的时空同步"这一核心概念，当前视觉表达不够强烈

Design Team 提出了"Cosmic HUD"概念：将界面打造为"星际社交终端"，通过深邃的太空背景、全息投影般的卡片、霓虹光效和电路纹理，营造"界面即传送门"的沉浸感。

## Decision（决策）

我们决定升级到 **Cosmic HUD (v3.3)** 视觉系统，主要变更包括：

### 视觉层面

1. **背景系统**:
   - 从单一极光渐变升级为三层结构：深空星云基底 + 星空粒子层 + 浮动云团
   - 使用 CSS 径向渐变模拟星云效果，避免加载大型图片
   - 引入缓慢的星空漂移动画（120s 循环）

2. **卡片容器**:
   - 从简单的玻璃态边框升级为"流光边框"（Gradient Border with Glow）
   - 添加电路纹理叠加层（Opacity 5%）
   - 增加 HUD 角落装饰（科幻感边角）

3. **交互元素**:
   - 输入框：Focus 时出现青色光晕和呼吸动画
   - 按钮：紫蓝渐变 + 顶部光泽扫过动画 (Shine Sweep)
   - 文字：标题支持全息发光效果 (text-shadow)

### 技术层面

1. **纯 CSS 实现**: 不依赖图片资源，所有效果通过 CSS gradients、filters、animations 实现
2. **模块化组件**: 封装 `CosmicCard`、`NeonInput`、`NeonButton` 三个核心组件
3. **字体升级**: 引入 Orbitron（标题）和 Rajdhani（科技文字）增强未来感

### 颜色策略

| 元素     | v3.2 (Aurora)          | v3.3 (Cosmic HUD)                      |
| -------- | ---------------------- | -------------------------------------- |
| 主紫色   | #a855f7                | #8b5cf6 (更沉稳)                       |
| 高亮青色 | #22d3ee                | #06b6d4 (更锐利)                       |
| 文字白色 | #ededed                | #ffffff (纯白，对比更强)               |
| 卡片背景 | rgba(255,255,255,0.05) | rgba(15,23,42,0.9) (更不透明，可读性↑) |

## Consequences（影响）

### 积极影响 ✅

1. **品牌独特性**: "星际终端"外观在同类产品中极具辨识度
2. **沉浸感增强**: 用户反馈"像在操作未来的设备"
3. **可维护性**: 纯 CSS 方案，不依赖设计资源管道，前端可独立迭代
4. **性能可控**: 所有动画使用 GPU 加速属性（transform、opacity），移动端可降级

### 消极影响 ⚠️

1. **学习曲线**: 新组件需要团队熟悉（已提供使用指南）
2. **浏览器兼容性**: Safari 对 `backdrop-filter` 支持有限（已添加 fallback）
3. **可读性风险**: 深色背景下，需要更严格控制文字对比度（已在测试中验证）
4. **视觉疲劳**: 过多的发光效果可能在长时间使用后产生不适（已设计"低能耗模式"入口）

### 迁移策略

- **向后兼容**: v3.2 的 CSS 变量保留，现有组件无需立即修改
- **渐进升级**: 优先在登录页、首页应用新组件，其他页面逐步迁移
- **移动端优化**: 在 `max-width: 767px` 时自动禁用部分动画和复杂边框

## Alternatives Considered（备选方案）

### 方案 A: 保持 Aurora 风格，仅优化配色

**优点**: 无需重构组件
**缺点**: 仍然难以与竞品区分

### 方案 B: 引入 3D/WebGL 背景

**优点**: 视觉效果极强
**缺点**: 性能开销大，移动端体验差，实现复杂度高

### 方案 C: 采用插画风格（手绘星空）

**优点**: 亲和力强
**缺点**: 与"高科技"产品定位不符，需要大量设计资源

## Validation（验证方式）

- [x] 在 Chrome/Edge/Firefox/Safari 上测试基础渲染
- [ ] A/B 测试：对比 v3.2 和 v3.3 的用户停留时长和互动率
- [ ] 可访问性检查：确保文字对比度符合 WCAG AA 标准
- [ ] 性能监测：在低端 Android 设备上测试帧率（目标 >30fps）

## References（参考资料）

- [PRD v3.3 - Cosmic HUD](../prd/20260213-SharedCalendar-V3.3-CosmicHUD.md)
- [使用指南](../architecture/cosmic-hud-guide.md)
- [灵感来源: Cyberpunk UI Design on Dribbble](https://dribbble.com/tags/cyberpunk-ui)
- [技术参考: Tailwind CSS Gradients](https://tailwindcss.com/docs/gradient-color-stops)

## Notes（备注）

此次升级是"从产品到品牌"的关键一步。Cosmic HUD 不仅是视觉层面的改变，更是在传达"Nexus 是连接人与人的时空通道"这一核心概念。随着后续"全息投影般的事件卡片"和"雷达扫描式日历选择"等微交互的实现，这套系统将成为 Shared Calendar 的核心竞争力之一。

---

**Author**: Product & Design Team
**Approved by**: Tech Lead
**Implementation PR**: TBD
