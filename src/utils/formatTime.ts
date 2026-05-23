import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

/** Safely parse a date string — appends 'Z' if no timezone info is present
 *  so PostgreSQL timestamps without timezone are treated as UTC. */
function parseDate(dateStr: string): Date {
  // If the string already has a timezone offset (+/-) or ends with Z, parse as-is
  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  // Otherwise treat as UTC by appending Z
  return new Date(dateStr + "Z");
}

export function formatMessageTime(dateStr: string): string {
  const date = parseDate(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
  return format(date, "dd MMM, HH:mm");
}

export function formatConversationTime(dateStr: string): string {
  const date = parseDate(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yyyy");
}

export function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return "a while ago";
  return formatDistanceToNow(parseDate(dateStr), { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns a live-updating relative time string (e.g. "about 5 hours ago").
 *  Re-computes every `intervalMs` milliseconds (default 30 s).
 *  Import and call inside a component — it uses useState/useEffect internally
 *  via the companion hook `useRelativeTime`. */
export function getRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseDate(dateStr), { addSuffix: true });
}
