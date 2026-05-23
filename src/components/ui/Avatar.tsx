import { getAvatarUrl } from "../../utils/fileHelpers";
import { colors } from "../../styles";

interface AvatarProps {
  username: string;
  avatar: string | null;
  isOnline?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizes = { xs: 28, sm: 36, md: 42, lg: 52, xl: 68 };
const dotSizes = { xs: 8, sm: 10, md: 12, lg: 14, xl: 16 };

export default function Avatar({ username, avatar, isOnline, size = "md" }: AvatarProps) {
  const px = sizes[size];
  const dot = dotSizes[size];
  return (
    <div style={{ position: "relative", flexShrink: 0, width: px, height: px }}>
      <img
        src={getAvatarUrl(avatar, username)}
        alt={username}
        style={{ width: px, height: px, borderRadius: "50%", objectFit: "cover", display: "block" }}
      />
      {isOnline !== undefined && (
        <span style={{
          position: "absolute", bottom: 1, right: 1,
          width: dot, height: dot, borderRadius: "50%",
          background: isOnline ? colors.success : colors.textDim,
          border: `2px solid ${colors.bgPanel}`,
        }} />
      )}
    </div>
  );
}
