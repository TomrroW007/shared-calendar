"use client";

/**
 * CosmicCard - Tech-Glass Panel Component (v3.3 Cosmic HUD)
 *
 * Refactored with CSS Mask technology for precise 1px edge glow
 * Features:
 * - Pure 1px gradient border using CSS Mask (no center bleed)
 * - Deep space glass background (transparent center)
 * - Circuit pattern overlay
 * - HUD corner decorations
 *
 * @param {React.ReactNode} children - Card content
 * @param {string} className - Additional CSS classes
 * @param {boolean} corners - Show corner decorations (default true)
 * @param {object} style - Custom inline styles
 */
export default function CosmicCard({
  children,
  className = "",
  corners = true,
  style = {},
  ...props
}) {
  return (
    <div className={`cosmic-card ${className}`} style={style} {...props}>
      {corners && (
        <>
          <div className="cosmic-card-corner-tl" />
          <div className="cosmic-card-corner-br" />
        </>
      )}
      <div className="cosmic-card-inner">{children}</div>
    </div>
  );
}
