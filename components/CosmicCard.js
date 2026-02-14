"use client";

/**
 * CosmicCard - Tech-Glass Panel Component (v3.3 Cosmic HUD)
 *
 * 高科技玻璃面板，具有：
 * - 流光边框（Gradient Border with Glow）
 * - 玻璃态背景（Frosted Glass with Backdrop Blur）
 * - 电路纹理叠加（Circuit Pattern Overlay）
 * - HUD 角落装饰（Corner Decorations）
 *
 * @param {React.ReactNode} children - 卡片内容
 * @param {string} className - 额外的 CSS 类名
 * @param {boolean} corners - 是否显示角落装饰（默认 true）
 * @param {object} style - 自定义内联样式
 */
export default function CosmicCard({
  children,
  className = "",
  corners = true,
  style = {},
}) {
  return (
    <div className={`cosmic-card ${className}`} style={style}>
      {/* Main Glass Panel */}
      <div className="cosmic-card-content">
        {/* HUD Corner Decorations */}
        {corners && (
          <>
            <div className="cosmic-card-corner-tl" />
            <div className="cosmic-card-corner-br" />
          </>
        )}

        {/* Content Layer */}
        <div style={{ position: "relative", zIndex: 10 }}>{children}</div>
      </div>
    </div>
  );
}
