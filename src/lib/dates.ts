/** Local calendar date as YYYY-MM-DD. The app's "day" follows the person, not UTC. */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

/** Whole days from a to b (positive when b is after a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseDate(b).getTime() - parseDate(a).getTime();
  return Math.round(ms / 86400000);
}

export function formatDate(s: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  try {
    return parseDate(s).toLocaleDateString(undefined, opts);
  } catch {
    return s;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

export function estimateMinutes(target: number, secondsPerRepetition: number): string {
  const total = target * secondsPerRepetition;
  if (total < 60) return "under a minute";
  const m = Math.round(total / 60);
  return `~${m} min`;
}
