import { ButtonHTMLAttributes, ReactNode, useState } from "react";
import { colors, radius, shadow } from "../../styles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary", size = "md", loading, children, disabled, style, ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, border: "none", cursor: disabled || loading ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 600, transition: "all 0.15s ease",
    opacity: disabled || loading ? 0.5 : 1, outline: "none",
    borderRadius: radius.lg,
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 14px", fontSize: 13 },
    md: { padding: "9px 18px", fontSize: 14 },
    lg: { padding: "12px 24px", fontSize: 15 },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: hovered ? colors.primaryHover : colors.primary,
      color: colors.white,
      boxShadow: hovered ? shadow.primary : "none",
    },
    ghost: {
      background: hovered ? colors.bgHover : "transparent",
      color: hovered ? colors.text : colors.textMuted,
    },
    danger: {
      background: hovered ? "#dc2626" : colors.danger,
      color: colors.white,
    },
    outline: {
      background: hovered ? colors.bgHover : "transparent",
      color: hovered ? colors.text : colors.textMuted,
      border: `1px solid ${hovered ? colors.borderLight : colors.border}`,
    },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...sizeStyles[size], ...variantStyles[variant], ...style }}
    >
      {loading && (
        <svg className="spin" width={15} height={15} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity={0.25} />
          <path fill="currentColor" opacity={0.75} d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
