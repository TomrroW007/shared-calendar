"use client";

/**
 * NeonButton - Cosmic Primary Button (v3.3 Cosmic HUD)
 *
 * 霓虹风格按钮，具有：
 * - 紫蓝渐变背景
 * - 强烈的外发光效果
 * - 顶部光泽动画（Shine Sweep）
 */
export default function NeonButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`neon-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
