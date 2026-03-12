/**
 * formatRelativeDate — smart relative date formatting utility.
 *
 * 6-tier format:
 *   < 1 minute  → "just now"
 *   < 1 hour    → "Xm ago"
 *   < 24 hours  → "Xh ago"
 *   < 48 hours  → "Yesterday"
 *   < 7 days    → short day name ("Mon", "Tue", ...)
 *   same year   → "Mar 5"
 *   older       → "Dec 15, 2025"
 *
 * No external date library — pure JS Date.
 */

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = diffMs / 86_400_000;

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 2) return 'Yesterday';
  if (diffDay < 7) return SHORT_DAYS[d.getUTCDay()]!;

  const month = SHORT_MONTHS[d.getUTCMonth()]!;
  const day = d.getUTCDate();

  if (d.getUTCFullYear() === now.getUTCFullYear()) {
    return `${month} ${day}`;
  }

  return `${month} ${day}, ${d.getUTCFullYear()}`;
}
