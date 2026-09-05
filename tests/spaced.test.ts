import { describe, expect, it } from "vitest";
import { applyAnswer, encounter, isDue, recallAccuracy } from "@/lib/spaced";

const t0 = new Date("2026-09-01T10:00:00Z");
const days = (n: number) => new Date(t0.getTime() + n * 86400000);

describe("spaced repetition", () => {
  it("starts as encountered with no review due", () => {
    const row = encounter(undefined, "word:subhana", t0);
    expect(row.stage).toBe("encountered");
    expect(isDue(row, t0)).toBe(false);
  });
  it("moves to learning on the first correct answer and schedules a review", () => {
    const row = applyAnswer(undefined, "word:subhana", true, t0);
    expect(row.stage).toBe("learning");
    expect(row.streak).toBe(1);
    expect(isDue(row, days(0))).toBe(false);
    expect(isDue(row, days(1))).toBe(true);
  });
  it("becomes understood after two correct answers", () => {
    let row = applyAnswer(undefined, "word:subhana", true, t0);
    row = applyAnswer(row, "word:subhana", true, days(1));
    expect(row.stage).toBe("understood");
  });
  it("needs time, not just streak, to be reviewed and mastered", () => {
    let row = applyAnswer(undefined, "word:subhana", true, t0);
    row = applyAnswer(row, "word:subhana", true, days(1));
    row = applyAnswer(row, "word:subhana", true, days(2));
    expect(row.stage).toBe("understood");
    row = applyAnswer(row, "word:subhana", true, days(4));
    expect(row.stage).toBe("reviewed");
    row = applyAnswer(row, "word:subhana", true, days(20));
    expect(row.stage).toBe("mastered");
  });
  it("steps down gently on a wrong answer and never invents progress", () => {
    let row = applyAnswer(undefined, "word:subhana", true, t0);
    row = applyAnswer(row, "word:subhana", true, days(1));
    row = applyAnswer(row, "word:subhana", false, days(2));
    expect(row.stage).toBe("learning");
    expect(row.streak).toBe(0);
    expect(row.incorrect).toBe(1);
  });
  it("computes recall accuracy", () => {
    const a = applyAnswer(undefined, "a", true, t0);
    const b = applyAnswer(undefined, "b", false, t0);
    expect(recallAccuracy([a, b])).toBe(0.5);
    expect(recallAccuracy([])).toBeNull();
  });
});
