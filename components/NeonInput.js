"use client";

import { forwardRef } from "react";

/**
 * NeonInput - Cosmic Style Input Field (v3.3 Cosmic HUD)
 *
 * 霓虹风格输入框，具有：
 * - 深黑玻璃背景
 * - Focus 时青色光晕和呼吸效果
 * - 电能感设计
 *
 * @param {string} type - Input 类型（text, email, password 等）
 * @param {string} placeholder - 占位符文字
 * @param {string} value - 输入值
 * @param {function} onChange - 变化回调
 * @param {string} className - 额外的 CSS 类名
 * @param {object} props - 其他 HTML input 属性
 */
const NeonInput = forwardRef(function NeonInput(
  {
    type = "text",
    placeholder = "Enter...",
    value,
    onChange,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`neon-input ${className}`}
      {...props}
    />
  );
});

export default NeonInput;
