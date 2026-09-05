import { describe, expect, it } from "vitest";
import { matchRoute } from "@/lib/router";
import { nextReminder, windowTime } from "@/lib/reminders";

describe("matchRoute", () => {
  it("matches static and param routes", () => {
    expect(matchRoute("/", "/")).toEqual({ params: {} });
    expect(matchRoute("/circles/:id", "/circles/abc")).toEqual({ params: { id: "abc" } });
    expect(matchRoute("/circles/:id", "/circles")).toBeNull();
    expect(matchRoute("/join/:code", "/join/AB%20CD")).toEqual({ params: { code: "AB CD" } });
  });
});

describe("reminders", () => {
  it("resolves window times and custom times", () => {
    expect(windowTime("morning")).toEqual({ hour: 8, minute: 30 });
    expect(windowTime("custom", "21:15")).toEqual({ hour: 21, minute: 15 });
    expect(windowTime("custom", "nope")).toBeNull();
  });
  it("picks the next upcoming window, rolling to tomorrow", () => {
    const now = new Date(2026, 8, 5, 23, 0, 0);
    const next = nextReminder(["morning", "evening"], undefined, now);
    expect(next?.window).toBe("morning");
    expect(next?.at.getDate()).toBe(6);
  });
});
