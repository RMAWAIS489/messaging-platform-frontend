import { InputHTMLAttributes, forwardRef, useState } from "react";
import { colors, radius } from "../../styles";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label && (
          <label style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          {icon && (
            <div style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: focused ? colors.primary : colors.textDim,
              display: "flex", alignItems: "center", pointerEvents: "none",
              transition: "color 0.15s",
            }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
            style={{
              width: "100%",
              background: colors.bgInput,
              border: `1.5px solid ${error ? colors.danger : focused ? colors.primary : colors.border}`,
              borderRadius: radius.md,
              padding: icon ? "10px 14px 10px 38px" : "10px 14px",
              fontSize: 14,
              color: colors.text,
              outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
              boxShadow: focused ? `0 0 0 3px ${error ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)"}` : "none",
              ...style,
            }}
          />
        </div>
        {error && <p style={{ fontSize: 12, color: colors.danger }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
