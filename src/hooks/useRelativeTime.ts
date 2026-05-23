import { useState, useEffect } from "react";
import { getRelativeTime } from "../utils/formatTime";

/**
 * Returns a live-updating relative time string for a given ISO date string.
 * Updates every `intervalMs` milliseconds (default: 30 000 = 30 s).
 *
 * Usage:
 *   const label = useRelativeTime(notification.createdAt);
 *   // → "about 5 hours ago", updates automatically
 */
export function useRelativeTime(dateStr: string, intervalMs = 30_000): string {
  const [label, setLabel] = useState(() => getRelativeTime(dateStr));

  useEffect(() => {
    // Recompute immediately when dateStr changes
    setLabel(getRelativeTime(dateStr));

    const id = setInterval(() => {
      setLabel(getRelativeTime(dateStr));
    }, intervalMs);

    return () => clearInterval(id);
  }, [dateStr, intervalMs]);

  return label;
}
