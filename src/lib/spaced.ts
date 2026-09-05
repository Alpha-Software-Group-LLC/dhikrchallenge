export type KnowledgeStage = "encountered" | "learning" | "understood" | "reviewed" | "mastered";

export interface KnowledgeRow {
  itemId: string;
  stage: KnowledgeStage;
  correct: number;
  incorrect: number;
  streak: number;
  firstSeenAt: string;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
}

export const STAGE_ORDER: KnowledgeStage[] = ["encountered", "learning", "understood", "reviewed", "mastered"];

/** Review intervals in days, indexed by streak. Light spaced repetition, not a memory palace. */
const INTERVALS = [1, 3, 7, 14, 30, 60];

export function newRow(itemId: string, now: Date): KnowledgeRow {
  return { itemId, stage: "encountered", correct: 0, incorrect: 0, streak: 0, firstSeenAt: now.toISOString(), lastReviewedAt: null, nextReviewAt: null };
}

/** Mark an item as encountered without downgrading progress. */
export function encounter(existing: KnowledgeRow | undefined, itemId: string, now: Date): KnowledgeRow {
  return existing ?? newRow(itemId, now);
}

function daysSince(iso: string, now: Date): number {
  return (now.getTime() - new Date(iso).getTime()) / 86400000;
}

/** Pure state transition for one answer. Mirrors the validation on the server. */
export function applyAnswer(existing: KnowledgeRow | undefined, itemId: string, correct: boolean, now: Date): KnowledgeRow {
  const row = existing ?? newRow(itemId, now);
  const streak = correct ? row.streak + 1 : 0;
  const age = daysSince(row.firstSeenAt, now);
  let stage: KnowledgeStage;
  if (!correct) {
    stage = row.stage === "encountered" ? "learning" : row.stage === "mastered" ? "reviewed" : row.stage === "reviewed" ? "understood" : "learning";
  } else if (streak >= 5 && age >= 14) stage = "mastered";
  else if (streak >= 3 && age >= 3) stage = "reviewed";
  else if (streak >= 2) stage = "understood";
  else stage = "learning";
  // never regress below the stage recall has already proven, except on a wrong answer
  if (correct && STAGE_ORDER.indexOf(stage) < STAGE_ORDER.indexOf(row.stage)) stage = row.stage;

  const interval = INTERVALS[Math.min(Math.max(streak - 1, 0), INTERVALS.length - 1)] ?? 1;
  const next = new Date(now.getTime() + interval * 86400000);
  return {
    ...row,
    stage,
    streak,
    correct: row.correct + (correct ? 1 : 0),
    incorrect: row.incorrect + (correct ? 0 : 1),
    lastReviewedAt: now.toISOString(),
    nextReviewAt: next.toISOString(),
  };
}

export function isDue(row: KnowledgeRow, now: Date): boolean {
  if (!row.nextReviewAt) return row.stage !== "encountered";
  return new Date(row.nextReviewAt).getTime() <= now.getTime();
}

export function recallAccuracy(rows: KnowledgeRow[]): number | null {
  const answered = rows.reduce((a, r) => a + r.correct + r.incorrect, 0);
  if (!answered) return null;
  return rows.reduce((a, r) => a + r.correct, 0) / answered;
}
