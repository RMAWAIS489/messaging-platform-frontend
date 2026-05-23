import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { colors, radius, shadow } from "../../styles";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ isOpen, onClose, title, children, width = 440 }: ModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      />
      <div className="fade-in" style={{
        position: "relative", width: "100%", maxWidth: width,
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        boxShadow: shadow.lg,
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: colors.textMuted,
              cursor: "pointer", padding: 4, borderRadius: radius.sm,
              display: "flex", alignItems: "center",
            }}
          >
            <X size={17} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
