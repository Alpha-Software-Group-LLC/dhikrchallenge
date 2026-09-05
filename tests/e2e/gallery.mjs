/* Settled, full-page screenshots of key screens for design review. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = process.argv[2] ?? "http://localhost:4173";
const out = process.argv[3] ?? "tests/e2e/shots/gallery";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
// BLOCK_EXTERNAL: keep runs hermetic and fast; Google Fonts fall back to system fonts.
const blockExternal = (ctx) => ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => route.abort());

const d = (n) => {
  const x = new Date();
  x.setDate(x.getDate() - n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const days = Array.from({ length: 11 }, (_, i) => ({ day: i + 1, date: d(12 - i), dhikrId: "subhanallah" }));
const seed = {
  version: 2, profile: { displayName: "Bilal" }, preferences: { duration: 3, reminderWindows: ["morning", "before-sleep"] }, onboardingCompleted: true,
  journey: { id: "j", journeyId: "stronger-heart-30", startedOn: d(12), status: "active", completedOn: null, completedDays: days },
  journeyHistory: [], completions: days.map((x) => ({ date: x.date, dhikrId: x.dhikrId })), totalCompletionDays: 11, firstCompletionDate: d(12),
  sessions: days.map((x, i) => ({ id: `s${i}`, dhikrId: x.dhikrId, kind: "journey", target: 33, count: 33, durationSeconds: 70, date: x.date, includeInStats: true, note: null, createdAt: `${x.date}T06:30:00` })),
  knowledge: [
    { itemId: "word:subhana", stage: "mastered", correct: 6, incorrect: 0, streak: 6, firstSeenAt: d(12), lastReviewedAt: d(1), nextReviewAt: d(-20) },
    { itemId: "concept:hamd", stage: "understood", correct: 2, incorrect: 0, streak: 2, firstSeenAt: d(11), lastReviewedAt: d(2), nextReviewAt: d(-1) },
    { itemId: "name:al-wakil", stage: "learning", correct: 1, incorrect: 1, streak: 1, firstSeenAt: d(3), lastReviewedAt: d(1), nextReviewAt: d(0) },
    { itemId: "verse:v-2-152", stage: "encountered", correct: 0, incorrect: 0, streak: 0, firstSeenAt: d(2), lastReviewedAt: null, nextReviewAt: null },
  ],
  reflections: [{ dhikrId: "alhamdulillah", date: d(1), mood: "grateful", note: "Noticed the sky on the walk home.", createdAt: `${d(1)}T07:00:00` }],
  savedItems: [{ itemType: "dhikr", itemId: "hasbunallah" }], circles: [],
};

async function run(name, path, { width = 390, height = 844, scheme = "dark", mock = false, fullPage = true, after } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: scheme, isMobile: width < 600, hasTouch: width < 600 });
  await blockExternal(ctx);
  const page = await ctx.newPage();
  await page.goto(base + "/");
  await page.evaluate((s) => {
    localStorage.setItem("dhikr:guest-mode", "true");
    localStorage.setItem("dhikr:guest:v2", JSON.stringify(s));
    localStorage.removeItem("dhikr:mock-circles");
  }, seed);
  if (mock) await page.evaluate(() => localStorage.setItem("dhikr:mock", "true"));
  await page.goto(base + path);
  await page.waitForTimeout(1200);
  if (after) await after(page);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage });
  await ctx.close();
  console.log("shot", name);
}

await run("today-dark", "/");
await run("today-light", "/", { scheme: "light" });
await run("today-desktop", "/", { width: 1280, height: 900, fullPage: false });
await run("journey", "/journey");
await run("library", "/dhikr");
await run("library-detail", "/dhikr/sayyid_al_istighfar");
await run("tasbih", "/tasbih");
await run("you-progress", "/you/progress");
await run("you-learned", "/you/learned");
await run("you-reminders", "/you/reminders");
await run("you-settings", "/you/settings");
await run("circles-list", "/circles", { mock: true });
await run("circle-home", "/circles/family", { mock: true });
await run("circle-home-light", "/circles/family", { mock: true, scheme: "light" });
await run("circle-new", "/circles/new", { mock: true });
await run("join", "/join/FAM1LY22", { mock: false });
await run("signup", "/signup");
await run("landing-desktop", "/", { width: 1280, height: 900, after: async (p) => p.evaluate(() => { localStorage.clear(); }).then(() => p.goto(base + "/")).then(() => p.waitForTimeout(1200)) });
await run("landing-mobile", "/", { after: async (p) => p.evaluate(() => { localStorage.clear(); }).then(() => p.goto(base + "/")).then(() => p.waitForTimeout(1200)) });
await browser.close();
