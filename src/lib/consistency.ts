import { addDays, daysBetween } from "./dates";

export interface Consistency {
  /** Consecutive active days ending today or yesterday. */
  currentStreak: number;
  bestStreak: number;
  last7: number;
  last30: number;
  /** Days since the last active day; 0 when active today. */
  daysSinceLast: number | null;
  activeToday: boolean;
  totalActiveDays: number;
}

/**
 * Consistency is computed from a set of active local dates. A missed day is
 * recorded, never punished: the streak resets but the last-7 / last-30 counts
 * and the best streak remain.
 */
export function computeConsistency(activeDates: Iterable<string>, today: string): Consistency {
  const set = new Set(activeDates);
  const sorted = [...set].sort();
  const activeToday = set.has(today);

  let cursor = activeToday ? today : addDays(today, -1);
  let currentStreak = 0;
  while (set.has(cursor)) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && daysBetween(prev, d) === 1) run += 1;
    else run = 1;
    bestStreak = Math.max(bestStreak, run);
    prev = d;
  }

  let last7 = 0;
  let last30 = 0;
  for (let i = 0; i < 30; i += 1) {
    const d = addDays(today, -i);
    if (set.has(d)) {
      last30 += 1;
      if (i < 7) last7 += 1;
    }
  }

  const last = sorted.at(-1) ?? null;
  const daysSinceLast = last ? Math.max(0, daysBetween(last, today)) : null;

  return { currentStreak, bestStreak, last7, last30, daysSinceLast, activeToday, totalActiveDays: set.size };
}

export type ReturnState = "new" | "active" | "yesterday" | "short-gap" | "long-gap";

/** Compassionate framing of a gap. */
export function returnState(c: Consistency): ReturnState {
  if (c.totalActiveDays === 0) return "new";
  if (c.activeToday) return "active";
  if (c.daysSinceLast === 1) return "yesterday";
  if (c.daysSinceLast !== null && c.daysSinceLast <= 3) return "short-gap";
  return "long-gap";
}

/** Strongest time-of-day window from session timestamps (ISO strings). */
export function strongestWindow(timestamps: string[]): { label: string; share: number } | null {
  if (!timestamps.length) return null;
  const buckets: Record<string, number> = { morning: 0, midday: 0, evening: 0, night: 0 };
  for (const t of timestamps) {
    const h = new Date(t).getHours();
    if (h >= 4 && h < 11) buckets.morning! += 1;
    else if (h >= 11 && h < 17) buckets.midday! += 1;
    else if (h >= 17 && h < 22) buckets.evening! += 1;
    else buckets.night! += 1;
  }
  const [label, count] = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]!;
  return { label, share: count / timestamps.length };
}
