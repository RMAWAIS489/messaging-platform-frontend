import { colors, radius, shadow } from "../../styles";

export default function TypingIndicator({ usernames }: { usernames: string[] }) {
  if (usernames.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 4 }}>
      <div style={{
        background: colors.bgMessage,
        borderRadius: "2px 12px 12px 12px",
        padding: "10px 14px",
        boxShadow: shadow.msg,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="bounce-dot" style={{
              width: 7, height: 7, borderRadius: "50%",
              background: colors.textMuted, display: "block",
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
        {usernames.length > 0 && (
          <span style={{ fontSize: 12, color: colors.textMuted }}>
            {usernames[0]} is typing
          </span>
        )}
      </div>
    </div>
  );
}
