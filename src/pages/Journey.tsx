import { useMemo, useState } from "react";
import { getDhikr, PATHWAYS, STRONGER_HEART, type DhikrItem, type JourneyDay } from "@/content";
import { useStore } from "@/data/store";
import { useRouter } from "@/components/router";
import { DhikrDetail } from "@/components/DhikrDetail";
import { QuestionCard } from "@/components/Lesson";
import { Arabic, Button, EmptyState, ProgressRing, Sheet } from "@/components/ui";
import { activeDates, journeyView } from "@/lib/journey";
import { computeConsistency } from "@/lib/consistency";
import { formatDate } from "@/lib/dates";
import { parseKnowledgeId } from "@/content/knowledge";

export function JourneyPage() {
  const { home, today, prefs, startJourney, savePreferences, notify, mode } = useStore();
  const { navigate } = useRouter();
  const view = useMemo(() => journeyView(home.journey, today), [home.journey, today]);
  const [detail, setDetail] = useState<DhikrItem | null>(null);
  const [dayOpen, setDayOpen] = useState<JourneyDay | null>(null);
  const [starting, setStarting] = useState(false);

  if (!view) {
    return (
      <div className="page">
        <header className="page-header">
          <div className="eyebrow">Journey</div>
          <h1>30 Days to a Stronger Heart</h1>
          <p>{STRONGER_HEART.description}</p>
        </header>
        <EmptyState
          arabic="بِسْمِ ٱللَّهِ"
          title="Begin with one small act of remembrance."
          body="Day 1 is thirty-three SubhanAllah. About two minutes."
          action={
            <Button
              size="lg"
              loading={starting}
              onClick={async () => {
                setStarting(true);
                try {
                  await startJourney(STRONGER_HEART.id);
                  navigate("/?begin=1");
                } catch (e) {
                  notify(e instanceof Error ? e.message : "Could not start", "error");
                } finally {
                  setStarting(false);
                }
              }}
            >
              Start Day 1
            </Button>
          }
        />
        <div className="stack" style={{ marginTop: 18 }}>
          {STRONGER_HEART.weeks.map((w) => (
            <div key={w.number} className="card">
              <div className="eyebrow">Week {w.number}</div>
              <div className="card-title" style={{ fontSize: 20 }}>
                {w.title}
              </div>
              <div className="card-note">{w.subtitle}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { journey, user } = view;
  const completedByDay = new Map(user.completedDays.map((d) => [d.day, d]));

  if (view.finished) {
    return <Recap />;
  }

  return (
    <div className="page">
      <header className="page-header anim-up">
        <div className="eyebrow">Journey</div>
        <h1>{journey.title}</h1>
        <p>{journey.tagline}</p>
      </header>

      <div className="card raised anim-up d1" style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 18 }}>
        <ProgressRing size={92} stroke={7} progress={view.progress} label={`${view.completedCount} of ${journey.lengthDays} days completed`}>
          <div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1 }}>
              {view.completedCount}
            </div>
            <div className="small muted">of {journey.lengthDays}</div>
          </div>
        </ProgressRing>
        <div>
          <div className="card-title" style={{ fontSize: 20 }}>
            Week {view.week.number} — {view.week.title}
          </div>
          <div className="card-note">{view.week.subtitle}</div>
          <div className="small muted" style={{ marginTop: 6 }}>
            Started {formatDate(user.startedOn)} · {view.completedToday ? "Today is complete" : `Day ${view.currentDay} is ready`}
          </div>
        </div>
      </div>

      {journey.weeks.map((w) => (
        <section key={w.number} className="week-block anim-up d2" aria-labelledby={`week-${w.number}`}>
          <div className="week-head">
            <h3 id={`week-${w.number}`}>
              Week {w.number} · {w.title}
            </h3>
            <span>{w.subtitle}</span>
          </div>
          <div className="day-grid" role="list">
            {journey.days
              .filter((d) => d.day >= w.days[0] && d.day <= w.days[1])
              .map((d) => {
                const done = completedByDay.has(d.day);
                const current = !done && d.day === view.currentDay && !view.completedToday;
                const locked = !done && !current;
                return (
                  <button
                    key={d.day}
                    type="button"
                    role="listitem"
                    className={`day-dot ${done ? "done" : ""} ${current ? "current" : ""} ${locked ? "locked" : ""}`}
                    onClick={() => setDayOpen(d)}
                    aria-label={`Day ${d.day}, ${getDhikr(d.dhikrId).title}${done ? ", completed" : current ? ", today" : ", upcoming"}`}
                  >
                    {done ? "✓" : d.day}
                  </button>
                );
              })}
          </div>
        </section>
      ))}

      <Sheet open={Boolean(dayOpen)} onClose={() => setDayOpen(null)} title={dayOpen ? `Day ${dayOpen.day}` : ""}>
        {dayOpen && (() => {
          const d = getDhikr(dayOpen.dhikrId);
          const entry = completedByDay.get(dayOpen.day);
          const isCurrent = !entry && dayOpen.day === view.currentDay;
          return (
            <div className="stack">
              <div style={{ textAlign: "center" }}>
                <Arabic text={d.arabic} size={d.arabic.length > 60 ? 24 : 32} />
                <div className="serif" style={{ fontStyle: "italic", color: "var(--gold2)", marginTop: 6 }}>
                  {d.transliteration}
                </div>
                <div className="small" style={{ color: "var(--text2)", marginTop: 4 }}>
                  {d.translation}
                </div>
                <div className="small muted" style={{ marginTop: 8 }}>
                  {dayOpen.target}
                  {d.unit ? ` ${d.unit}` : "×"} · {entry ? `Completed ${formatDate(entry.date)}` : isCurrent ? "Ready today" : `Opens after Day ${dayOpen.day - 1}`}
                </div>
              </div>
              {entry && (
                <div className="card">
                  <div className="eyebrow green">Recall · {dayOpen.lesson.title}</div>
                  <QuestionCard question={dayOpen.lesson.question} />
                </div>
              )}
              <div className="actions" style={{ marginTop: 6 }}>
                <Button variant="quiet" onClick={() => { setDayOpen(null); setDetail(d); }}>
                  Meaning & source
                </Button>
                {isCurrent && !view.completedToday && (
                  <Button onClick={() => navigate("/?begin=1")}>Begin Day {dayOpen.day}</Button>
                )}
              </div>
            </div>
          );
        })()}
      </Sheet>
      <DhikrDetail dhikr={detail} onClose={() => setDetail(null)} />
      {mode === "guest" && (
        <p className="small muted" style={{ marginTop: 18, textAlign: "center" }}>
          Guest progress stays on this device. Create an account to keep it and join Circles.
        </p>
      )}
    </div>
  );

  function Recap() {
    const consistency = computeConsistency(activeDates(home, prefs.freeSessionsInStats), today);
    const forms = new Set(user.completedDays.map((d) => d.dhikrId)).size;
    const learned = home.knowledge.filter((k) => ["understood", "reviewed", "mastered"].includes(k.stage));
    const concepts = learned.filter((k) => ["concept", "word", "name"].includes(parseKnowledgeId(k.itemId)?.type ?? "")).length;
    const verses = home.knowledge.filter((k) => parseKnowledgeId(k.itemId)?.type === "verse").length;
    const circle = home.circles[0];
    const showedUp = user.completedDays.length;
    return (
      <div className="page">
        <header className="page-header anim-up" style={{ textAlign: "center" }}>
          <div className="eyebrow">30 days with dhikr</div>
          <h1>You showed up.</h1>
          <p style={{ margin: "8px auto 0" }}>
            {user.completedOn ? `Completed ${formatDate(user.completedOn, { month: "long", day: "numeric", year: "numeric" })}` : "Journey complete"}
          </p>
        </header>
        <div className="grid-2 anim-up d1" style={{ marginBottom: 14 }}>
          <div className="stat">
            <b>{showedUp}</b>
            <span>days you showed up</span>
          </div>
          <div className="stat">
            <b>{forms}</b>
            <span>forms of remembrance practised</span>
          </div>
          <div className="stat">
            <b>{concepts}</b>
            <span>concepts and words understood</span>
          </div>
          <div className="stat">
            <b>{verses}</b>
            <span>Qur'an verses encountered</span>
          </div>
          {circle && (
            <div className="stat" style={{ gridColumn: "1 / -1" }}>
              <b>{consistency.last30}</b>
              <span>of the last 30 days you remembered Allah · with {circle.name}</span>
            </div>
          )}
        </div>
        <div className="card raised gold anim-up d2" style={{ textAlign: "center", padding: 28 }}>
          <Arabic text="فَٱذْكُرُونِىٓ أَذْكُرْكُمْ" size={30} color="var(--gold)" />
          <div className="small muted" style={{ marginTop: 6 }}>
            Remember Me; I will remember you. · Qur'an 2:152
          </div>
          <div className="card-title" style={{ marginTop: 18, fontSize: 26 }}>
            The challenge ends. The remembrance doesn't.
          </div>
          <div className="card-note">Choose a daily rhythm to carry forward, or begin another thirty days.</div>
        </div>
        <section className="anim-up d3" style={{ marginTop: 18 }}>
          <div className="eyebrow">Your daily rhythm</div>
          <div className="stack">
            {PATHWAYS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`choice ${prefs.pathwayId === p.id ? "selected" : ""}`}
                onClick={() => savePreferences({ pathwayId: p.id }).then(() => notify(`Your rhythm is now ${p.title}.`, "success")).catch((e) => notify(e.message, "error"))}
              >
                <span className="check" aria-hidden="true">
                  {prefs.pathwayId === p.id ? "✓" : ""}
                </span>
                <span>
                  {p.title}
                  <small>{p.description}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
        <div className="stack anim-up d4" style={{ marginTop: 18 }}>
          <Button
            size="lg"
            block
            variant="secondary"
            loading={starting}
            onClick={async () => {
              setStarting(true);
              try {
                await startJourney(STRONGER_HEART.id);
                navigate("/");
              } catch (e) {
                notify(e instanceof Error ? e.message : "Could not start", "error");
              } finally {
                setStarting(false);
              }
            }}
          >
            Begin another 30 days
          </Button>
          <Button variant="ghost" block onClick={() => navigate("/")}>
            Continue with my daily rhythm
          </Button>
        </div>
        <p className="small muted" style={{ marginTop: 16, textAlign: "center", lineHeight: 1.6 }}>
          These numbers describe activity in this app. Reward belongs to Allah alone.
        </p>
        <DhikrDetail dhikr={detail} onClose={() => setDetail(null)} />
      </div>
    );
  }
}
