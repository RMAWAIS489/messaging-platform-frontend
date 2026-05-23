import { colors, radius } from "../../styles";

export default function Badge({ count, max = 99 }: { count: number; max?: number }) {
  if (count <= 0) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 18, height: 18, padding: "0 5px",
      borderRadius: radius.full,
      background: colors.primary,
      color: colors.white,
      fontSize: 10, fontWeight: 700, lineHeight: 1,
    }}>
      {count > max ? `${max}+` : count}
    </span>
  );
}
