import { describe, expect, it } from "vitest";
import { computeConsistency, returnState, strongestWindow } from "@/lib/consistency";
import { addDays, daysBetween, localDateStr } from "@/lib/dates";

describe("dates", () => {
  it("adds and diffs local dates", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
    expect(localDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("computeConsistency", () => {
  const today = "2026-09-05";
  it("is empty for a new user", () => {
    const c = computeConsistency([], today);
    expect(c.currentStreak).toBe(0);
    expect(c.daysSinceLast).toBeNull();
    expect(returnState(c)).toBe("new");
  });
  it("counts a streak ending today", () => {
    const c = computeConsistency(["2026-09-03", "2026-09-04", "2026-09-05"], today);
    expect(c.currentStreak).toBe(3);
    expect(c.activeToday).toBe(true);
    expect(c.last7).toBe(3);
    expect(returnState(c)).toBe("active");
  });
  it("keeps the streak alive when yesterday was active and today is not yet", () => {
    const c = computeConsistency(["2026-09-03", "2026-09-04"], today);
    expect(c.currentStreak).toBe(2);
    expect(returnState(c)).toBe("yesterday");
  });
  it("resets the streak after a gap but keeps best and last-30", () => {
    const c = computeConsistency(["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23", "2026-09-01"], today);
    expect(c.currentStreak).toBe(0);
    expect(c.bestStreak).toBe(4);
    expect(c.last30).toBe(5);
    expect(c.daysSinceLast).toBe(4);
    expect(returnState(c)).toBe("long-gap");
  });
  it("frames a short gap compassionately", () => {
    const c = computeConsistency(["2026-09-02"], today);
    expect(returnState(c)).toBe("short-gap");
  });
});

describe("strongestWindow", () => {
  it("finds the dominant time of day", () => {
    const w = strongestWindow(["2026-09-01T06:10:00", "2026-09-02T07:00:00", "2026-09-03T21:00:00"]);
    expect(w?.label).toBe("morning");
    expect(w?.share).toBeCloseTo(2 / 3);
  });
  it("returns null without data", () => {
    expect(strongestWindow([])).toBeNull();
  });
});
