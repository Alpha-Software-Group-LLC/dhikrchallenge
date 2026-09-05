import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ADHKAR, ADHKAR_BY_ID, STRONGER_HEART, PATHWAYS, NAMES_BY_ID, resolveKnowledgeItem, searchLibrary, FREE_TASBIH_IDS } from "@/content";

describe("content integrity", () => {
  it("every dhikr has a source path and no empty text", () => {
    for (const d of ADHKAR) {
      expect(d.arabic.trim().length, d.id).toBeGreaterThan(0);
      expect(d.source.collection, d.id).toBeTruthy();
      expect(d.source.reference, d.id).toBeTruthy();
      expect(["approved", "review"], d.id).toContain(d.reviewStatus);
      for (const n of d.names ?? []) expect(NAMES_BY_ID[n], `${d.id} -> ${n}`).toBeDefined();
    }
  });
  it("ids are unique", () => {
    expect(new Set(ADHKAR.map((d) => d.id)).size).toBe(ADHKAR.length);
  });
  it("the 30-day journey references existing dhikr and resolvable knowledge", () => {
    expect(STRONGER_HEART.days).toHaveLength(30);
    STRONGER_HEART.days.forEach((d, i) => {
      expect(d.day).toBe(i + 1);
      expect(ADHKAR_BY_ID[d.dhikrId], `day ${d.day}`).toBeDefined();
      expect(d.target).toBeGreaterThan(0);
      for (const id of [...d.lesson.introduces, ...d.lesson.question.reinforces]) expect(resolveKnowledgeItem(id), `day ${d.day} -> ${id}`).not.toBeNull();
      expect(d.lesson.question.options).toHaveLength(3);
    });
  });
  it("journey weeks cover every day exactly once", () => {
    const covered = new Set<number>();
    for (const w of STRONGER_HEART.weeks) for (let d = w.days[0]; d <= w.days[1]; d += 1) {
      expect(covered.has(d)).toBe(false);
      covered.add(d);
    }
    expect(covered.size).toBe(30);
  });
  it("pathways and free tasbih reference existing dhikr", () => {
    for (const p of PATHWAYS) for (const id of p.dhikrIds) expect(ADHKAR_BY_ID[id], `${p.id} -> ${id}`).toBeDefined();
    for (const id of FREE_TASBIH_IDS) expect(ADHKAR_BY_ID[id]).toBeDefined();
  });
  it("the SQL migration seeds the same journey days as the client", () => {
    const sql = readFileSync(new URL("../supabase/migrations/0002_evolution.sql", import.meta.url), "utf8");
    for (const d of STRONGER_HEART.days) {
      const re = new RegExp(`\\('stronger-heart-30', ${d.day}, '${d.dhikrId}', ${d.target}\\)`);
      expect(re.test(sql), `day ${d.day} ${d.dhikrId} ${d.target}`).toBe(true);
    }
    for (const d of ADHKAR) expect(sql.includes(`('${d.id}',`), `content item ${d.id}`).toBe(true);
  });
});

describe("searchLibrary", () => {
  it("matches transliteration variants and common spellings", () => {
    expect(searchLibrary("subhan allah").results[0]?.item.id).toBe("subhanallah");
    expect(searchLibrary("SubhanAllah").results.some((r) => r.item.id === "subhanallah")).toBe(true);
    expect(searchLibrary("astagfirullah").results.some((r) => r.item.id === "astaghfirullah")).toBe(true);
    expect(searchLibrary("alhamdulilah").results.some((r) => r.item.id === "alhamdulillah")).toBe(true);
  });
  it("maps feelings to occasions", () => {
    const r = searchLibrary("I feel anxious");
    expect(r.occasions).toContain("difficulty");
    expect(r.results.some((x) => x.type === "dhikr" && x.item.id === "dua_anxiety")).toBe(true);
  });
  it("flags fiqh questions without answering them", () => {
    expect(searchLibrary("is this halal").fiqh).toBe(true);
    expect(searchLibrary("morning").fiqh).toBe(false);
  });
});
