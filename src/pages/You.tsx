import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { Button, Sheet, Toggle } from "@/components/ui";
import { QuestionCard } from "@/components/Lesson";
import { computeConsistency, strongestWindow } from "@/lib/consistency";
import { activeDates, journeyView } from "@/lib/journey";
import { addDays, formatDate } from "@/lib/dates";
import { KNOWLEDGE_TYPE_LABELS, resolveKnowledgeItem, parseKnowledgeId, getJourney, ADHKAR_BY_ID, type KnowledgeItemType } from "@/content";
import { isDue, recallAccuracy, STAGE_ORDER, type KnowledgeStage } from "@/lib/spaced";
import { REMINDER_WINDOWS, nextReminder, type ReminderWindow } from "@/lib/reminders";
import { track } from "@/lib/analytics";
import { friendlyError } from "@/data/backend";
import { PrivacyPromise } from "./Circles";
import { InstallCard } from "./Install";

type Section = "progress" | "learned" | "reminders" | "settings";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "progress", label: "Progress" },
  { id: "learned", label: "Learned" },
  { id: "reminders", label: "Reminders" },
  { id: "settings", label: "Settings" },
];

const STAGE_LABEL: Record<KnowledgeStage, string> = { encountered: "Encountered", learning: "Learning", understood: "Understood", reviewed: "Reviewed", mastered: "Mastered" };

export function YouPage({ section: initial }: { section?: string }) {
  const [section, setSection] = useState<Section>((SECTIONS.find((s) => s.id === initial)?.id as Section) ?? "progress");
  const { user, mode } = useStore();
  useEffect(() => {
    if (initial && SECTIONS.some((s) => s.id === initial)) setSection(initial as Section);
  }, [initial]);
  return (
    <div className="page">
      <header className="page-header anim-up">
        <div className="eyebrow">You</div>
        <h1>{user?.name ?? "Your practice"}</h1>
        <p>{mode === "guest" ? "Practising as a guest on this device." : "A quiet record of returning. Activity in this app, never a measure of the heart."}</p>
      </header>
      <div className="chip-row anim-up d1" role="tablist" aria-label="Sections" style={{ marginBottom: 16 }}>
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={section === s.id} className={`chip ${section === s.id ? "active" : ""}`} onClick={() => { setSection(s.id); window.history.replaceState({}, "", `/you/${s.id}`); }}>
            {s.label}
          </button>
        ))}
      </div>
      {section === "progress" && <Progress />}
      {section === "learned" && <Learned />}
      {section === "reminders" && <Reminders />}
      {section === "settings" && <Settings />}
    </div>
  );
}

function Progress() {
  const { home, today, prefs } = useStore();
  const dates = useMemo(() => activeDates(home, prefs.freeSessionsInStats), [home, prefs.freeSessionsInStats]);
  const c = useMemo(() => computeConsistency(dates, today), [dates, today]);
  const view = journeyView(home.journey, today);
  const window_ = strongestWindow(home.sessions.map((s) => s.createdAt));
  const circle = home.circles[0];
  const series = useMemo(() => Array.from({ length: 30 }, (_, i) => addDays(today, -(29 - i))).map((d) => ({ date: d, on: dates.has(d), today: d === today })), [dates, today]);
  const forms = new Set(home.completions.map((x) => x.dhikrId)).size;
  const learned = home.knowledge.filter((k) => ["understood", "reviewed", "mastered"].includes(k.stage)).length;
  const insights: string[] = [];
  if (c.last30 > 0) insights.push(`You remembered Allah on ${c.last30} of the last 30 days.`);
  if (learned > 0) insights.push(`You have understood the meaning of ${learned} ${learned === 1 ? "item" : "items"} of knowledge.`);
  if (window_ && window_.share >= 0.5) insights.push(`Your strongest routine is in the ${window_.label}.`);
  if (circle && circle.participatedToday !== null && circle.participatedToday > 1) insights.push(`${circle.participatedToday} of ${circle.memberCount} in ${circle.name} remembered Allah today.`);

  return (
    <div className="stack anim-in">
      <div className="grid-2">
        <div className="stat">
          <b>{c.last7}/7</b>
          <span>days in the last week</span>
        </div>
        <div className="stat">
          <b>{Math.round((c.last30 / 30) * 100)}%</b>
          <span>30-day consistency</span>
        </div>
        <div className="stat">
          <b>{c.currentStreak}</b>
          <span>current streak · best {c.bestStreak}</span>
        </div>
        <div className="stat">
          <b>{view ? view.completedCount : 0}</b>
          <span>journey days completed</span>
        </div>
      </div>
      {c.daysSinceLast !== null && c.daysSinceLast >= 2 && (
        <div className="card quiet">
          <div style={{ fontWeight: 600 }}>Welcome back.</div>
          <div className="small muted">A missed day is a day; it is not a verdict. The streak restarts, the last-30 count stays.</div>
        </div>
      )}
      <div className="card">
        <div className="row between">
          <div className="eyebrow" style={{ marginBottom: 0 }}>
            Last 30 days
          </div>
          <span className="small muted">{c.last30} active</span>
        </div>
        <div className="bar-chart" style={{ marginTop: 14 }} role="img" aria-label={`${c.last30} of the last 30 days active`}>
          {series.map((d) => (
            <div key={d.date} className={`bar ${d.on ? "on" : ""} ${d.today && d.on ? "today" : ""}`} style={{ height: d.on ? "70%" : "8%" }} title={`${formatDate(d.date)}${d.on ? " · remembered" : ""}`} />
          ))}
        </div>
      </div>
      {insights.length > 0 && (
        <div className="card green">
          <div className="eyebrow green">Quiet observations</div>
          <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: 14 }}>
            {insights.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid-3">
        <div className="stat">
          <b>{forms}</b>
          <span>adhkar practised</span>
        </div>
        <div className="stat">
          <b>{home.reflections.length}</b>
          <span>private reflections</span>
        </div>
        <div className="stat">
          <b>{home.sessions.filter((s) => s.kind === "free").length}</b>
          <span>free sessions</span>
        </div>
      </div>
      {home.reflections.length > 0 && (
        <div className="card">
          <div className="eyebrow">Recent reflections · private</div>
          {home.reflections.slice(0, 5).map((r) => (
            <div key={`${r.dhikrId}-${r.date}`} className="list-row" style={{ display: "block" }}>
              <div className="row between">
                <strong style={{ fontSize: 14 }}>{ADHKAR_BY_ID[r.dhikrId]?.title ?? r.dhikrId}</strong>
                <span className="small muted">
                  {formatDate(r.date)} · {r.mood}
                </span>
              </div>
              {r.note && (
                <p className="body-text" style={{ fontSize: 14, marginTop: 6, color: "var(--text2)" }}>
                  {r.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Learned() {
  const { home, today } = useStore();
  const rows = home.knowledge;
  const accuracy = recallAccuracy(rows);
  const now = new Date();
  const due = rows.filter((k) => isDue(k, now));
  const byType = useMemo(() => {
    const map = new Map<KnowledgeItemType, typeof rows>();
    for (const r of rows) {
      const t = parseKnowledgeId(r.itemId)?.type;
      if (!t) continue;
      map.set(t, [...(map.get(t) ?? []), r]);
    }
    return map;
  }, [rows]);
  const reviewQuestion = useMemo(() => {
    if (!home.journey || !due.length) return null;
    const journey = getJourney(home.journey.journeyId);
    const done = new Set(home.journey.completedDays.map((d) => d.day));
    const dueIds = new Set(due.map((d) => d.itemId));
    const candidates = journey.days.filter((d) => done.has(d.day) && d.lesson.question.reinforces.some((id) => dueIds.has(id)));
    if (!candidates.length) return null;
    const seed = today.split("-").reduce((a, b) => a + Number(b), 0);
    return candidates[seed % candidates.length]!.lesson;
  }, [home.journey, due, today]);

  if (!rows.length) {
    return (
      <div className="card quiet anim-in" style={{ textAlign: "center", padding: 30 }}>
        <div className="card-title" style={{ fontSize: 20 }}>
          Understanding grows with each day.
        </div>
        <div className="card-note">After a session, choose “Learn what you just said”. What you understand will gather here.</div>
        <div style={{ marginTop: 14 }}>
          <Link to="/" className="btn primary">
            Today's dhikr
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack anim-in">
      <div className="grid-3">
        <div className="stat">
          <b>{rows.filter((r) => STAGE_ORDER.indexOf(r.stage) >= 2).length}</b>
          <span>understood or better</span>
        </div>
        <div className="stat">
          <b>{accuracy === null ? "—" : `${Math.round(accuracy * 100)}%`}</b>
          <span>recall accuracy</span>
        </div>
        <div className="stat">
          <b>{due.length}</b>
          <span>ready for review</span>
        </div>
      </div>
      {reviewQuestion && (
        <div className="card green">
          <div className="eyebrow green">Review · {reviewQuestion.title}</div>
          <QuestionCard key={reviewQuestion.id} question={reviewQuestion.question} />
        </div>
      )}
      {([...byType.entries()] as [KnowledgeItemType, typeof rows][]).map(([type, items]) => (
        <div key={type} className="card">
          <div className="eyebrow">
            {KNOWLEDGE_TYPE_LABELS[type]} · {items.length}
          </div>
          {items
            .slice()
            .sort((a, b) => STAGE_ORDER.indexOf(b.stage) - STAGE_ORDER.indexOf(a.stage))
            .map((k) => {
              const ref = resolveKnowledgeItem(k.itemId);
              if (!ref) return null;
              return (
                <div key={k.itemId} className="list-row" style={{ padding: "10px 0" }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{ref.label}</div>
                  <span className={`pill ${k.stage === "encountered" ? "muted" : k.stage === "mastered" ? "gold" : ""}`}>{STAGE_LABEL[k.stage]}</span>
                </div>
              );
            })}
        </div>
      ))}
      <p className="small muted" style={{ lineHeight: 1.6 }}>
        Encountered → Learning → Understood → Reviewed → Mastered. Items return for a light review after 1, 3, 7, 14 and 30 days.
      </p>
    </div>
  );
}

function Reminders() {
  const { prefs, savePreferences, notify } = useStore();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => (typeof Notification === "undefined" ? "unsupported" : Notification.permission));
  const windows = prefs.reminderWindows;
  const next = nextReminder(windows, prefs.customReminderTime);
  const toggle = async (w: ReminderWindow) => {
    const set = new Set(windows);
    if (set.has(w)) set.delete(w);
    else set.add(w);
    try {
      await savePreferences({ reminderWindows: [...set] });
      if (set.size && permission === "default") await requestPermission();
      if (set.size) track("reminder_enabled", { windows: set.size });
    } catch (e) {
      notify(friendlyError(e), "error");
    }
  };
  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPermission(p);
  };
  return (
    <div className="stack anim-in">
      <div className="card">
        <div className="eyebrow">Reminder windows</div>
        <p className="small" style={{ color: "var(--text2)", marginBottom: 8 }}>
          Choose when a quiet reminder would help. Without prayer-time calculation, “after Fajr” and “after Maghrib” are approximate; adjust the custom time below.
        </p>
        {REMINDER_WINDOWS.map((w) => (
          <div key={w.id} className="switch-row">
            <div>
              <div className="label">{w.label}</div>
              <div className="hint">
                {w.note} · {String(w.hour).padStart(2, "0")}:{String(w.minute).padStart(2, "0")}
              </div>
            </div>
            <Toggle checked={windows.includes(w.id)} onChange={() => void toggle(w.id)} label={w.label} />
          </div>
        ))}
        <div className="switch-row">
          <div style={{ flex: 1 }}>
            <div className="label">Custom time</div>
            <input type="time" className="input" style={{ marginTop: 6, maxWidth: 160 }} value={prefs.customReminderTime ?? ""} onChange={(e) => void savePreferences({ customReminderTime: e.target.value }).catch((err) => notify(friendlyError(err), "error"))} aria-label="Custom reminder time" />
          </div>
          <Toggle checked={windows.includes("custom")} onChange={() => void toggle("custom")} label="Custom time" />
        </div>
      </div>
      <div className="card quiet">
        <div className="eyebrow">How reminders work</div>
        <p className="small" style={{ color: "var(--text2)", lineHeight: 1.7 }}>
          {permission === "unsupported" && "This browser does not support notifications. Reminder windows still shape what Today suggests."}
          {permission === "denied" && "Notifications are blocked for this site. You can allow them in your browser settings."}
          {permission === "default" && "Allow notifications to receive a gentle nudge in your chosen windows."}
          {permission === "granted" && "Notifications are on. They fire while Dhikr Challenge is open or installed on your home screen; there is no push server, and your data never leaves your account."}
        </p>
        {permission === "default" && (
          <Button size="sm" variant="secondary" onClick={requestPermission}>
            Allow notifications
          </Button>
        )}
        {next && (
          <p className="small muted" style={{ marginTop: 10 }}>
            Next reminder: {next.at.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
          </p>
        )}
        <p className="small muted" style={{ marginTop: 10, fontStyle: "italic" }}>
          “A quiet moment for dhikr.” · “Your Circle is remembering Allah today.” · Never “don't lose your streak”.
        </p>
      </div>
    </div>
  );
}

function Settings() {
  const { prefs, savePreferences, notify, user, mode, signOut, backend, accountsAvailable } = useStore();
  const { navigate } = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (partial: Parameters<typeof savePreferences>[0]) => savePreferences(partial).catch((e) => notify(friendlyError(e), "error"));

  const exportData = async () => {
    setBusy(true);
    try {
      const data = await backend.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dhikr-challenge-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notify(friendlyError(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack anim-in">
      <div className="card">
        <div className="eyebrow">Practice</div>
        <label className="field" style={{ marginTop: 4 }}>
          <span>Daily commitment</span>
          <select value={prefs.duration} onChange={(e) => void set({ duration: Number(e.target.value) })}>
            {[1, 3, 5, 10].map((m) => (
              <option key={m} value={m}>
                {m} minute{m > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Recitation audio</span>
          <select value={prefs.audio} onChange={(e) => void set({ audio: e.target.value as typeof prefs.audio })}>
            <option value="arabic">Arabic recitation</option>
            <option value="both">Arabic, then English meaning</option>
            <option value="english">English meaning</option>
            <option value="off">Off</option>
          </select>
        </label>
        <div className="switch-row" style={{ marginTop: 10 }}>
          <div>
            <div className="label">Transliteration</div>
            <div className="hint">Show Latin letters under the Arabic</div>
          </div>
          <Toggle checked={prefs.showTransliteration} onChange={(v) => void set({ showTransliteration: v })} label="Transliteration" />
        </div>
        <div className="switch-row">
          <div>
            <div className="label">Haptic feedback</div>
            <div className="hint">A small vibration per count, where supported</div>
          </div>
          <Toggle checked={prefs.haptics} onChange={(v) => void set({ haptics: v })} label="Haptics" />
        </div>
        <div className="switch-row">
          <div>
            <div className="label">Soft tick sound</div>
            <div className="hint">Off by default</div>
          </div>
          <Toggle checked={prefs.sound} onChange={(v) => void set({ sound: v })} label="Sound" />
        </div>
        <div className="switch-row">
          <div>
            <div className="label">Keep screen awake during dhikr</div>
          </div>
          <Toggle checked={prefs.keepAwake} onChange={(v) => void set({ keepAwake: v })} label="Keep awake" />
        </div>
        <div className="switch-row">
          <div>
            <div className="label">Count free tasbih in my progress</div>
            <div className="hint">Never shared with Circles either way</div>
          </div>
          <Toggle checked={prefs.freeSessionsInStats} onChange={(v) => void set({ freeSessionsInStats: v })} label="Free sessions in stats" />
        </div>
      </div>

      <div className="card">
        <div className="eyebrow">Appearance</div>
        <div className="row wrap" role="radiogroup" aria-label="Theme">
          {(["system", "dark", "light"] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={prefs.theme === t} className={`chip ${prefs.theme === t ? "active" : ""}`} onClick={() => void set({ theme: t })}>
              {t === "system" ? "Match device" : t === "dark" ? "Dark" : "Light"}
            </button>
          ))}
        </div>
      </div>

      <InstallCard />

      <div className="card">
        <div className="eyebrow">Account</div>
        {mode === "account" ? (
          <>
            <div style={{ fontWeight: 600 }}>{user?.name}</div>
            <div className="small muted">{user?.email}</div>
            <div className="stack" style={{ marginTop: 14, gap: 8 }}>
              <Button variant="quiet" size="sm" onClick={exportData} loading={busy}>
                Export my data (JSON)
              </Button>
              <Button variant="quiet" size="sm" onClick={() => void signOut().then(() => navigate("/"))}>
                Sign out
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete account and all data
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="small" style={{ color: "var(--text2)", lineHeight: 1.6 }}>
              You're practising as a guest. Everything lives on this device. Create a free account to keep your progress across devices and join Circles.
            </div>
            <div className="stack" style={{ marginTop: 14, gap: 8 }}>
              {accountsAvailable && (
                <Button size="sm" onClick={() => navigate("/signup")}>
                  Create a free account
                </Button>
              )}
              <Button variant="quiet" size="sm" onClick={exportData}>
                Export my data (JSON)
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                Erase guest data on this device
              </Button>
            </div>
          </>
        )}
      </div>

      <PrivacyPromise />
      <p className="small muted" style={{ textAlign: "center", lineHeight: 1.7 }}>
        Arabic recordings by Hamad Al-Duraim (MIT, Islamic Pro Azkar API). Qur'an sample by Mishary Rashid Alafasy via alquran.cloud.
      </p>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title={mode === "account" ? "Delete your account?" : "Erase guest data?"}>
        <p className="body-text" style={{ color: "var(--text2)" }}>
          {mode === "account" ? "This permanently removes your account, journey, sessions, reflections, knowledge and Circle memberships. Circles you own are deleted for everyone. This cannot be undone." : "This removes the journey and sessions stored on this device."}
        </p>
        <div className="actions">
          <Button variant="quiet" onClick={() => setConfirmDelete(false)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await backend.deleteAccount();
                await signOut();
                notify("Deleted. May Allah make your path easy.", "success");
                navigate("/");
              } catch (e) {
                notify(friendlyError(e), "error");
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
