/* Browser walkthrough of the major journeys against a preview build.
   Usage: node tests/e2e/walkthrough.mjs http://localhost:4173 out-dir */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:4173";
const out = process.argv[3] ?? "tests/e2e/shots";
mkdirSync(out, { recursive: true });

const errors = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
// BLOCK_EXTERNAL: keep runs hermetic and fast; Google Fonts fall back to system fonts.
const blockExternal = (ctx) => ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => route.abort());

async function newPage(width, height, name, colorScheme = "dark") {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: width < 600, isMobile: width < 600, colorScheme });
  await blockExternal(ctx);
  const page = await ctx.newPage();
  page.on("console", (m) => {
    // /api/config is not served by the static preview; guest mode is the expected outcome.
    if (m.type() === "error" && !/ERR_CONNECTION_RESET|api\/config|Failed to load resource/.test(m.text())) errors.push(`[${name}] console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  return { ctx, page };
}

const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
async function tapN(page, n) {
  const zone = page.locator(".tap-zone");
  for (let i = 0; i < n; i += 1) {
    await zone.tap();
    await page.waitForTimeout(45);
  }
}
const expect = (cond, msg) => {
  if (!cond) {
    errors.push(`ASSERT: ${msg}`);
    console.log("  ✗", msg);
  } else console.log("  ✓", msg);
};

// ------------------------------------------------------------------ NEW USER (guest)
{
  const { ctx, page } = await newPage(390, 844, "new-user");
  await page.goto(base + "/");
  await page.waitForSelector("text=Remember Allah.");
  await shot(page, "01-landing-mobile");
  expect(await page.isVisible("text=Begin the 30-Day Challenge"), "landing shows primary CTA");
  await page.click("text=Begin the 30-Day Challenge");
  await page.waitForSelector("text=Welcome.");
  await shot(page, "02-onboarding-1");
  await page.click("text=Remember Allah more consistently");
  await page.click("text=Continue");
  await page.click("text=I'm just getting started");
  await page.click("text=Continue");
  await page.waitForSelector("text=Start small.");
  await shot(page, "03-onboarding-3");
  await page.click("text=Continue");
  await page.waitForSelector("text=Begin Day 1.");
  await shot(page, "04-onboarding-4");
  await page.click("button:has-text('Begin Dhikr')");
  await page.waitForSelector(".session");
  await shot(page, "05-session-start");
  await tapN(page, 20);
  await shot(page, "06-session-mid");
  // pause / undo / keyboard
  await page.click("[aria-label='Pause']");
  expect(await page.isVisible("text=Paused"), "session can pause");
  await page.click("[aria-label='Resume']");
  await page.click("[aria-label='Undo last count']");
  await page.keyboard.press("Space");
  await tapN(page, 13);
  await page.waitForSelector("text=Alhamdulillah.", { timeout: 5000 });
  await shot(page, "07-completion");
  expect(await page.isVisible("text=33 / 33"), "completion shows 33 / 33");
  await page.click("text=Learn what you just said");
  await page.waitForSelector("text=What subhan means");
  await shot(page, "08-lesson");
  await page.click("text=That Allah is free of every imperfection");
  await page.waitForSelector("text=Yes.");
  await page.click("button:has-text('Continue')");
  await page.waitForSelector("text=Reflect · private");
  await shot(page, "09-reflection");
  await page.click("text=Grateful");
  await page.fill("textarea", "Noticed the sky on the walk.");
  await page.click("text=Save reflection");
  await page.waitForSelector("text=Completed today");
  await shot(page, "10-today-completed");
  expect(await page.isVisible("text=Day 1 of your journey"), "today shows Day 1 context after completion");
  // reload: state persists
  await page.reload();
  await page.waitForSelector("text=Completed today");
  expect(true, "guest state survives reload");
  await page.click("a.nav-item:has-text('Journey')");
  await page.waitForSelector("text=Week 1 — Remember");
  await shot(page, "11-journey");
  await page.click("[aria-label^='Day 1,']");
  await page.waitForSelector("text=Recall · What subhan means");
  await shot(page, "12-journey-day-sheet");
  await page.keyboard.press("Escape");
  await page.click("a.nav-item:has-text('Dhikr')");
  await page.waitForSelector("text=The library");
  await page.fill("input[type=search]", "anxious");
  await page.waitForSelector("text=From worry and grief");
  await shot(page, "13-library-search");
  await page.click("text=From worry and grief");
  await page.waitForSelector("text=Why this dhikr matters");
  await shot(page, "14-dhikr-detail");
  await page.click("text=Sahih al-Bukhari 6369");
  await page.waitForSelector("text=Grade · sahih");
  expect(true, "source sheet opens with grade");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.click("text=Free tasbih");
  await page.waitForSelector("text=Count, quietly.");
  await page.click("text=Open-ended");
  await page.click("button:has-text('Begin')");
  await page.waitForSelector(".session");
  await tapN(page, 5);
  await page.click("button:has-text('Finish')");
  await page.waitForSelector("text=Save session");
  await shot(page, "15-free-complete");
  await page.click("text=Save session");
  await page.waitForSelector("text=Recent");
  expect(await page.isVisible("text=5"), "free session recorded");
  await page.click("a.nav-item:has-text('You')");
  await page.waitForSelector("text=30-day consistency");
  await shot(page, "16-you-progress");
  await page.click("[role=tab]:has-text('Learned')");
  await page.waitForSelector("text=Arabic words");
  await shot(page, "17-you-learned");
  await page.click("[role=tab]:has-text('Reminders')");
  await page.waitForSelector("text=Reminder windows");
  await page.click("[role=tab]:has-text('Settings')");
  await page.waitForSelector("text=Appearance");
  await page.click("text=Light");
  await page.waitForTimeout(200);
  await shot(page, "18-you-settings-light");
  expect((await page.getAttribute("html", "data-theme")) === "light", "light theme applies");
  await page.click("text=Dark");
  await page.click("a.nav-item:has-text('Circles')");
  await page.waitForSelector("text=Circles need an account.");
  await shot(page, "19-circles-guest");
  // Missed-day flow: fake the last completion being 4 days ago
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("dhikr:guest:v2"));
    const shift = (d) => {
      const x = new Date(d + "T12:00:00");
      x.setDate(x.getDate() - 4);
      return x.toISOString().slice(0, 10);
    };
    raw.journey.completedDays = raw.journey.completedDays.map((c) => ({ ...c, date: shift(c.date) }));
    raw.completions = raw.completions.map((c) => ({ ...c, date: shift(c.date) }));
    raw.sessions = raw.sessions.map((s) => ({ ...s, date: shift(s.date) }));
    localStorage.setItem("dhikr:guest:v2", JSON.stringify(raw));
  });
  await page.goto(base + "/");
  await page.waitForSelector("text=Welcome back.");
  await shot(page, "20-missed-days");
  expect(await page.isVisible("text=Day 2 of your journey"), "missed days do not skip content (Day 2 next)");
  await ctx.close();
}

// ------------------------------------------------------------------ DAY 30 recap (guest)
{
  const { ctx, page } = await newPage(390, 844, "day30");
  await page.goto(base + "/");
  await page.evaluate(() => {
    const today = new Date();
    const d = (n) => {
      const x = new Date(today);
      x.setDate(x.getDate() - n);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    };
    const days = Array.from({ length: 29 }, (_, i) => ({ day: i + 1, date: d(29 - i), dhikrId: "subhanallah" }));
    localStorage.setItem("dhikr:guest-mode", "true");
    localStorage.setItem(
      "dhikr:guest:v2",
      JSON.stringify({
        version: 2,
        profile: { displayName: null },
        preferences: { duration: 3 },
        onboardingCompleted: true,
        journey: { id: "j", journeyId: "stronger-heart-30", startedOn: d(29), status: "active", completedOn: null, completedDays: days },
        journeyHistory: [],
        completions: days.map((x) => ({ date: x.date, dhikrId: x.dhikrId })),
        totalCompletionDays: 29,
        firstCompletionDate: d(29),
        sessions: [],
        knowledge: [],
        reflections: [],
        savedItems: [],
        circles: [],
      }),
    );
  });
  await page.goto(base + "/");
  await page.waitForSelector("text=Day 30 of your journey");
  await shot(page, "21-day30-today");
  await page.click("button:has-text('Begin Dhikr')");
  await page.waitForSelector(".session");
  await tapN(page, 100);
  await page.waitForSelector("text=Alhamdulillah.");
  await page.click("text=Learn what you just said");
  await page.waitForSelector("text=The challenge ends.");
  await page.click("text=Remember Me; I will remember you");
  await page.click("button:has-text('Continue')");
  await page.click("text=Skip");
  await page.waitForSelector("text=You showed up.");
  await shot(page, "22-recap");
  expect(await page.isVisible("text=The challenge ends. The remembrance doesn't."), "recap ends with the remembrance line");
  await page.click("text=Morning & Evening Adhkar");
  await page.waitForSelector("text=Your rhythm is now");
  await page.click("text=Continue with my daily rhythm");
  await page.waitForSelector("text=Your daily rhythm");
  await shot(page, "23-post-journey-today");
  await ctx.close();
}

// ------------------------------------------------------------------ CIRCLES (mock account)
{
  const { ctx, page } = await newPage(390, 844, "circles");
  await page.goto(base + "/");
  await page.evaluate(() => {
    localStorage.setItem("dhikr:mock", "true");
    localStorage.setItem("dhikr:guest:v2", JSON.stringify({ version: 2, profile: { displayName: "Bilal" }, preferences: {}, onboardingCompleted: true, journey: { id: "j", journeyId: "stronger-heart-30", startedOn: "2026-09-01", status: "active", completedOn: null, completedDays: [] }, journeyHistory: [], completions: [], totalCompletionDays: 0, firstCompletionDate: null, sessions: [], knowledge: [], reflections: [], savedItems: [], circles: [] }));
  });
  await page.goto(base + "/circles");
  await page.waitForSelector("text=Qureshi Family");
  await shot(page, "24-circles-list");
  expect(await page.isVisible("text=of 5 remembered Allah today"), "circle of five shows the group count (suppression only below four members)");
  await page.click("text=Qureshi Family");
  await page.waitForSelector("text=Members · 5");
  await shot(page, "25-circle-home");
  expect(await page.isVisible("text=Keeps activity private"), "private member shown without status");
  expect(await page.isVisible("text=Maryam made du'a for you."), "encouragement received is shown");
  await page.click("[aria-label='Encourage Hana']");
  await page.waitForSelector("text=Encourage Hana");
  await shot(page, "26-encourage");
  await page.click("button:has-text(\"Made du'a for you\")");
  await page.waitForSelector("text=Sent.");
  await page.click("text=Invite");
  await page.waitForSelector(".invite-code");
  await shot(page, "27-invite");
  await page.keyboard.press("Escape");
  await page.click("text=Settings");
  await page.waitForSelector("text=Circle settings");
  await shot(page, "28-circle-settings");
  await page.click("text=Make admin");
  await page.waitForSelector("text=Role updated.");
  await page.keyboard.press("Escape");
  // complete today's dhikr and see the circle update
  await page.goto(base + "/");
  await page.waitForSelector("button:has-text('Begin Dhikr')");
  await page.click("button:has-text('Begin Dhikr')");
  await page.waitForSelector(".session");
  await tapN(page, 33);
  await page.waitForSelector("text=Alhamdulillah.");
  await page.click("button:has-text('Continue')");
  await page.click("text=Skip");
  await page.waitForSelector("text=Completed today");
  expect(await page.isVisible("text=of 5 remembered today") || await page.isVisible("text=Remembering together today"), "today shows circle card");
  await page.goto(base + "/circles/family");
  await page.waitForSelector("text=You completed Day 1.");
  await shot(page, "29-circle-after-completion");
  // join flow
  await page.goto(base + "/join/FAM1LY22");
  await page.waitForSelector("text=already a member");
  await page.goto(base + "/circles/new");
  await page.fill("input[placeholder='Qureshi Family']", "Brothers");
  await page.click("text=Create Circle");
  await page.waitForSelector(".invite-code");
  await shot(page, "30-new-circle-invite");
  await ctx.close();
}

// ------------------------------------------------------------------ Desktop + tablet layout checks
{
  for (const [w, h, name, scheme] of [[1280, 800, "desktop", "dark"], [820, 1180, "tablet", "light"], [375, 667, "small-phone", "dark"], [430, 932, "large-phone", "light"]]) {
    const { ctx, page } = await newPage(w, h, name, scheme);
    await page.goto(base + "/");
    await page.evaluate(() => localStorage.setItem("dhikr:guest-mode", "true"));
    await page.evaluate(() => {
      localStorage.setItem("dhikr:guest:v2", JSON.stringify({ version: 2, profile: { displayName: null }, preferences: {}, onboardingCompleted: true, journey: { id: "j", journeyId: "stronger-heart-30", startedOn: "2026-09-01", status: "active", completedOn: null, completedDays: [{ day: 1, date: "2026-09-01", dhikrId: "subhanallah" }] }, journeyHistory: [], completions: [{ date: "2026-09-01", dhikrId: "subhanallah" }], totalCompletionDays: 1, firstCompletionDate: "2026-09-01", sessions: [], knowledge: [], reflections: [], savedItems: [], circles: [] }));
    });
    await page.goto(base + "/");
    await page.waitForSelector("button:has-text('Begin Dhikr')");
    await shot(page, `31-today-${name}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(!overflow, `${name}: no horizontal overflow on Today`);
    await page.click("button:has-text('Begin Dhikr')");
    await page.waitForSelector(".session");
    await shot(page, `32-session-${name}`);
    const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(!overflow2, `${name}: no horizontal overflow in session`);
    await ctx.close();
  }
}

await browser.close();
if (errors.length) {
  console.log("\nProblems:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log("\nAll walkthroughs passed.");
