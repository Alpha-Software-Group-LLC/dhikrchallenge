/**
 * Reminder windows. Without prayer-time calculation, "after Fajr" and "after
 * Maghrib" are approximate hours the person can adjust in settings. Delivery is
 * honest about platform limits: notifications are scheduled while the app is
 * open or installed and running; there is no push server.
 */
export type ReminderWindow = "morning" | "after-fajr" | "midday" | "after-maghrib" | "evening" | "before-sleep" | "custom";

export const REMINDER_WINDOWS: { id: ReminderWindow; label: string; hour: number; minute: number; note: string }[] = [
  { id: "after-fajr", label: "After Fajr", hour: 6, minute: 0, note: "An approximate time; adjust below" },
  { id: "morning", label: "Morning", hour: 8, minute: 30, note: "Before the day fills up" },
  { id: "midday", label: "Midday", hour: 13, minute: 0, note: "A pause in the middle" },
  { id: "after-maghrib", label: "After Maghrib", hour: 19, minute: 0, note: "An approximate time; adjust below" },
  { id: "evening", label: "Evening", hour: 21, minute: 0, note: "Before the day ends" },
  { id: "before-sleep", label: "Before sleep", hour: 22, minute: 30, note: "The last words of the night" },
];

export const REMINDER_MESSAGES = [
  "A quiet moment for dhikr.",
  "Your heart may need this today.",
  "Before the day ends, take two minutes for remembrance.",
  "Return to remembrance.",
  "Small acts. Consistently.",
];

export function windowTime(id: ReminderWindow, custom?: string): { hour: number; minute: number } | null {
  if (id === "custom") {
    if (!custom || !/^\d{2}:\d{2}$/.test(custom)) return null;
    const [h, m] = custom.split(":").map(Number);
    return { hour: h ?? 0, minute: m ?? 0 };
  }
  const w = REMINDER_WINDOWS.find((x) => x.id === id);
  return w ? { hour: w.hour, minute: w.minute } : null;
}

/** Next reminder Date from now across the selected windows. */
export function nextReminder(windows: ReminderWindow[], custom: string | undefined, now: Date = new Date()): { at: Date; window: ReminderWindow } | null {
  let best: { at: Date; window: ReminderWindow } | null = null;
  for (const w of windows) {
    const t = windowTime(w, custom);
    if (!t) continue;
    for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
      const at = new Date(now);
      at.setDate(at.getDate() + dayOffset);
      at.setHours(t.hour, t.minute, 0, 0);
      if (at.getTime() > now.getTime() + 1000) {
        if (!best || at < best.at) best = { at, window: w };
        break;
      }
    }
  }
  return best;
}

/** The recommended remembrance window for a given hour, used on Today. */
export function recommendedWindow(now: Date = new Date()): { label: string; note: string } {
  const h = now.getHours();
  if (h < 5) return { label: "Before dawn", note: "A quiet moment before the day begins." };
  if (h < 12) return { label: "Morning remembrance", note: "Begin with a heart turned toward Allah." };
  if (h < 17) return { label: "Midday pause", note: "Return to presence between the day's demands." };
  if (h < 21) return { label: "Evening remembrance", note: "Close the day with calm and gratitude." };
  return { label: "Before sleep", note: "A soft landing before rest." };
}

let timer: number | null = null;

/** Schedule the next local notification while this page is alive. Returns a cancel function. */
export function scheduleLocalReminder(windows: ReminderWindow[], custom: string | undefined): () => void {
  if (timer) window.clearTimeout(timer);
  timer = null;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return () => {};
  const next = nextReminder(windows, custom);
  if (!next) return () => {};
  const delay = Math.min(next.at.getTime() - Date.now(), 2 ** 31 - 1);
  timer = window.setTimeout(async () => {
    const body = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)]!;
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.showNotification("Dhikr Challenge", { body, icon: "/icons/icon-192.png", tag: "dhikr-reminder" });
      else new Notification("Dhikr Challenge", { body, icon: "/icons/icon-192.png", tag: "dhikr-reminder" });
    } catch {
      /* ignore */
    }
    scheduleLocalReminder(windows, custom);
  }, delay);
  return () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };
}
