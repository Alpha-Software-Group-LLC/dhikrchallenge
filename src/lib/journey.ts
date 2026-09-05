import { getJourney, getJourneyDay, weekForDay, PATHWAYS, getDhikr, type Journey, type JourneyDay, type JourneyWeek, type DhikrItem } from "@/content";
import type { HomeData, UserJourney } from "@/data/types";
import { daysBetween } from "./dates";

export interface JourneyView {
  journey: Journey;
  user: UserJourney;
  /** Next day to complete (1..length). Equals length when finished. */
  currentDay: number;
  currentDef: JourneyDay;
  week: JourneyWeek;
  completedCount: number;
  completedToday: boolean;
  todayDef: JourneyDay | null;
  finished: boolean;
  progress: number;
}

export function journeyView(user: UserJourney | null, today: string): JourneyView | null {
  if (!user) return null;
  const journey = getJourney(user.journeyId);
  const completedCount = user.completedDays.length;
  const finished = user.status === "completed" || completedCount >= journey.lengthDays;
  const todayEntry = user.completedDays.find((d) => d.date === today) ?? null;
  const currentDay = Math.min(completedCount + 1, journey.lengthDays);
  const currentDef = getJourneyDay(journey, currentDay);
  return {
    journey,
    user,
    currentDay,
    currentDef,
    week: weekForDay(journey, currentDay),
    completedCount,
    completedToday: Boolean(todayEntry),
    todayDef: todayEntry ? getJourneyDay(journey, todayEntry.day) : null,
    finished,
    progress: completedCount / journey.lengthDays,
  };
}

/** Post-journey daily rhythm: rotate through the chosen pathway by calendar day. */
export function dailyRhythmDhikr(home: HomeData, today: string): { dhikr: DhikrItem; pathwayTitle: string } {
  const pathway = PATHWAYS.find((p) => p.id === home.preferences.pathwayId) ?? PATHWAYS.find((p) => p.id === "everyday")!;
  const anchor = home.journey?.completedOn ?? home.firstCompletionDate ?? today;
  const idx = Math.max(0, daysBetween(anchor, today)) % pathway.dhikrIds.length;
  return { dhikr: getDhikr(pathway.dhikrIds[idx]!), pathwayTitle: pathway.title };
}

/** Dates on which the person remembered Allah in the app (journey/daily completions plus opted-in free sessions). */
export function activeDates(home: HomeData, includeFree: boolean): Set<string> {
  const set = new Set(home.completions.map((c) => c.date));
  if (includeFree) for (const s of home.sessions) if (s.kind === "free" && s.includeInStats && s.count > 0) set.add(s.date);
  return set;
}
