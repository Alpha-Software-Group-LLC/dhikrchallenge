import { useEffect, useMemo, useState } from "react";
import { getDhikr, NAMES_OF_ALLAH, QURAN_VERSES, type DhikrItem, type MicroLesson } from "@/content";
import { useStore } from "@/data/store";
import { useRouter, Link } from "@/components/router";
import { DhikrSession, type SessionContext } from "@/components/DhikrSession";
import { DhikrDetail } from "@/components/DhikrDetail";
import { QuestionCard } from "@/components/Lesson";
import { Arabic, Button, ErrorState, ProgressRing, Skeleton, SourceChip } from "@/components/ui";
import { Recitation } from "@/components/Recitation";
import { computeConsistency, returnState } from "@/lib/consistency";
import { estimateMinutes } from "@/lib/dates";
import { recommendedWindow } from "@/lib/reminders";
import { isDue } from "@/lib/spaced";
import { activeDates, dailyRhythmDhikr, journeyView } from "@/lib/journey";
import { track } from "@/lib/analytics";

interface ActiveSession {
  dhikr: DhikrItem;
  target: number;
  context: SessionContext;
  lesson?: MicroLesson;
  reflectionPrompt?: string;
  day?: number;
}

export function TodayPage() {
  const store = useStore();
  const { home, user, today, loading, error, reload, prefs, mode } = store;
  const { navigate, search } = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [detail, setDetail] = useState<DhikrItem | null>(null);
  const view = useMemo(() => journeyView(home.journey, today), [home.journey, today]);
  const consistency = useMemo(() => computeConsistency(activeDates(home, prefs.freeSessionsInStats), today), [home, prefs.freeSessionsInStats, today]);
  const state = returnState(consistency);
  const windowNow = recommendedWindow();
  const firstName = (user?.name ?? "").split(" ")[0];

  const rhythm = useMemo(() => (view?.finished ? dailyRhythmDhikr(home, today) : null), [view?.finished, home, today]);
  const completedToday = consistency.activeToday;

  const primary: { dhikr: DhikrItem; target: number; label: string; lesson?: MicroLesson; reflectionPrompt?: string; day?: number } | null = useMemo(() => {
    if (view && !view.finished) {
      const def = view.completedToday && view.todayDef ? view.todayDef : view.currentDef;
      const dayNum = view.completedToday && view.todayDef ? view.todayDef.day : view.currentDay;
      return { dhikr: getDhikr(def.dhikrId), target: def.target, label: `Day ${dayNum} · ${view.week.title}`, lesson: def.lesson, reflectionPrompt: def.reflectionPrompt, day: dayNum };
    }
    if (rhythm) return { dhikr: rhythm.dhikr, target: rhythm.dhikr.defaultTarget, label: rhythm.pathwayTitle, reflectionPrompt: rhythm.dhikr.reflectionPrompt };
    return null;
  }, [view, rhythm]);

  useEffect(() => {
    if (view && !view.finished) track("journey_day_viewed", { day: view.currentDay });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.currentDay]);

  const begin = () => {
    if (!primary) return;
    const ctx: SessionContext = primary.day
      ? { kind: "journey", day: primary.day, label: primary.label, contextKey: `journey:${primary.day}` }
      : { kind: "daily", label: primary.label, contextKey: `daily:${primary.dhikr.id}` };
    setSession({ dhikr: primary.dhikr, target: primary.target, context: ctx, lesson: primary.lesson, reflectionPrompt: primary.reflectionPrompt, day: primary.day });
  };

  // Deep link from onboarding: /?begin=1
  useEffect(() => {
    const params = new URLSearchParams(search || window.location.search);
    if (params.get("begin") === "1" && primary && !completedToday && !session) {
      window.history.replaceState({}, "", "/");
      begin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, primary?.dhikr.id, completedToday]);

  const dueReview = useMemo(() => {
    const now = new Date();
    const due = home.knowledge.filter((k) => isDue(k, now)).map((k) => k.itemId);
    if (!due.length || !home.journey) return null;
    const journey = journeyView(home.journey, today)?.journey;
    if (!journey) return null;
    const completedDays = new Set(home.journey.completedDays.map((d) => d.day));
    for (const d of journey.days) {
      if (!completedDays.has(d.day)) continue;
      if (d.lesson.question.reinforces.some((id) => due.includes(id))) return { question: d.lesson.question, title: d.lesson.title };
    }
    return null;
  }, [home.knowledge, home.journey, today]);

  const knowledgeCard = useMemo(() => {
    const seed = today.split("-").reduce((a, b) => a + Number(b), 0);
    if (primary?.dhikr.names?.length) {
      const id = primary.dhikr.names[seed % primary.dhikr.names.length]!;
      const n = NAMES_OF_ALLAH.find((x) => x.id === id);
      if (n) return { kind: "name" as const, item: n };
    }
    return { kind: "verse" as const, item: QURAN_VERSES[seed % QURAN_VERSES.length]! };
  }, [primary?.dhikr.names, today]);

  const circle = home.circles[0];
  const greeting = firstName ? `Assalamu Alaikum, ${firstName}` : "Assalamu Alaikum";

  if (loading && !home.journey && !error) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="eyebrow">{windowNow.label}</div>
          <h1>{greeting}</h1>
        </div>
        <Skeleton lines={5} height={26} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header anim-up">
        <div className="eyebrow">{windowNow.label}</div>
        <h1>{greeting}</h1>
        {view && !view.finished && (
          <p>
            Day {view.completedToday && view.todayDef ? view.todayDef.day : view.currentDay} of your journey · Week {view.week.number}, {view.week.title}
          </p>
        )}
        {view?.finished && <p>Your daily rhythm · {rhythm?.pathwayTitle}</p>}
        {!view && <p>Begin with one small act of remembrance.</p>}
      </header>

      {error && (
        <div style={{ marginBottom: 14 }}>
          <ErrorState message={error} onRetry={() => void reload()} />
        </div>
      )}

      {(state === "short-gap" || state === "long-gap") && !completedToday && (
        <div className="card quiet anim-up" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ fontSize: 20 }}>
            Welcome back.
          </div>
          <div className="card-note">What matters now is returning. Your journey continues from where you left it.</div>
        </div>
      )}

      {!view && (
        <div className="card raised gold anim-up d1" style={{ marginBottom: 14 }}>
          <div className="eyebrow">30 Days to a Stronger Heart</div>
          <div className="card-title">One dhikr a day. Countless rewards.</div>
          <div className="card-note">A personal thirty-day journey: remember, understand, carry it with you, live in remembrance.</div>
          <div style={{ marginTop: 16 }}>
            <Button block size="lg" onClick={() => store.startJourney("stronger-heart-30").then(() => navigate("/?begin=1")).catch((e) => store.notify(e.message, "error"))}>
              Start Day 1
            </Button>
          </div>
        </div>
      )}

      {primary && (
        <section className="card raised gold anim-up d1" aria-labelledby="today-dhikr" style={{ marginBottom: 14, overflow: "hidden" }}>
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div className="eyebrow" style={{ marginBottom: 0 }}>
              {primary.label}
            </div>
            <SourceChip source={primary.dhikr.source} virtueSource={primary.dhikr.virtueSource} compact />
          </div>
          <div style={{ padding: "16px 0 6px" }}>
            <Arabic text={primary.dhikr.arabic} size={primary.dhikr.arabic.length > 200 ? 22 : primary.dhikr.arabic.length > 80 ? 26 : primary.dhikr.arabic.length > 40 ? 32 : Math.min(prefs.arabicSize, 44)} color="var(--text)" />
          </div>
          <h2 id="today-dhikr" className={`serif ${primary.dhikr.arabic.length > 80 ? "clamp-2" : ""}`} style={{ fontStyle: "italic", fontWeight: 500, fontSize: primary.dhikr.arabic.length > 80 ? 16 : 20, color: "var(--gold2)", textAlign: "center" }}>
            {primary.dhikr.transliteration}
          </h2>
          <p className={primary.dhikr.arabic.length > 80 ? "clamp-3" : ""} style={{ textAlign: "center", color: "var(--text2)", fontSize: 15, marginTop: 6, lineHeight: 1.55 }}>{primary.dhikr.translation}</p>
          <div className="row" style={{ justifyContent: "center", gap: 14, marginTop: 12, color: "var(--text3)", fontSize: 13 }}>
            <span>
              {primary.target}
              {primary.dhikr.unit ? ` ${primary.dhikr.unit}` : "×"}
            </span>
            <span aria-hidden="true">·</span>
            <span>{estimateMinutes(primary.target, primary.dhikr.secondsPerRepetition)}</span>
            <span aria-hidden="true">·</span>
            <Recitation dhikr={primary.dhikr} compact />
          </div>
          <div style={{ marginTop: 18 }}>
            {!completedToday ? (
              <Button size="lg" block onClick={begin}>
                Begin Dhikr
              </Button>
            ) : (
              <div className="card green" style={{ padding: 14, textAlign: "center" }}>
                <div style={{ color: "var(--green2)", fontWeight: 600 }}>Completed today · Alhamdulillah</div>
                <div className="small muted" style={{ marginTop: 4 }}>
                  {view && !view.finished ? `Day ${Math.min(view.currentDay, view.journey.lengthDays)} opens tomorrow.` : "Return tomorrow, or open the library for more."}
                </div>
              </div>
            )}
          </div>
          <button type="button" className="btn ghost block" style={{ marginTop: 6 }} onClick={() => setDetail(primary.dhikr)}>
            Why this dhikr today?
          </button>
        </section>
      )}

      <div className="grid-2 anim-up d2" style={{ marginBottom: 14 }}>
        {view && (
          <Link to="/journey" className="card clickable" style={{ textDecoration: "none", color: "inherit", display: "flex", gap: 12, alignItems: "center" }}>
            <ProgressRing size={56} stroke={5} progress={view.progress} label={`${view.completedCount} of ${view.journey.lengthDays} days`}>
              <span className="serif" style={{ fontSize: 15, fontWeight: 600 }}>
                {view.completedCount}
              </span>
            </ProgressRing>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Journey</div>
              <div className="small muted">{view.finished ? "30 days complete" : `${view.completedCount} of ${view.journey.lengthDays} days`}</div>
            </div>
          </Link>
        )}
        {circle ? (
          <Link to={`/circles/${circle.id}`} className="card clickable" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{circle.name}</div>
            <div className="small muted" style={{ marginTop: 4 }}>
              {circle.participatedToday === null ? "Remembering together today" : `${circle.participatedToday} of ${circle.memberCount} remembered today`}
            </div>
            <div className="member-dots" style={{ marginTop: 10 }} aria-hidden="true">
              {Array.from({ length: Math.min(circle.memberCount, 12) }).map((_, i) => (
                <i key={i} className={circle.participatedToday !== null && i < circle.participatedToday ? "on" : ""} />
              ))}
            </div>
          </Link>
        ) : (
          <Link to={mode === "guest" ? "/signup" : "/circles/new"} className="card clickable" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Remember together</div>
            <div className="small muted" style={{ marginTop: 4 }}>
              Create a private Circle for family or friends.
            </div>
          </Link>
        )}
      </div>

      {dueReview ? (
        <section className="card anim-up d3" style={{ marginBottom: 14 }}>
          <div className="eyebrow green">A quick recall · {dueReview.title}</div>
          <QuestionCard question={dueReview.question} />
        </section>
      ) : (
        <section className="card anim-up d3" style={{ marginBottom: 14 }}>
          {knowledgeCard.kind === "name" ? (
            <>
              <div className="eyebrow green">A Name to carry · {knowledgeCard.item.source.collection} {knowledgeCard.item.source.reference}</div>
              <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
                <Arabic text={knowledgeCard.item.arabic} size={30} color="var(--gold2)" align="right" />
                <div>
                  <div style={{ fontWeight: 600 }}>{knowledgeCard.item.transliteration}</div>
                  <div className="small" style={{ color: "var(--text2)" }}>
                    {knowledgeCard.item.meaning}
                  </div>
                  <div className="small muted" style={{ marginTop: 6, fontStyle: "italic" }}>
                    {knowledgeCard.item.reflection}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow green">A verse to carry · {knowledgeCard.item.reference}</div>
              <p className="body-text">{knowledgeCard.item.meaning}</p>
            </>
          )}
        </section>
      )}

      <section className="card quiet anim-up d4">
        <div className="eyebrow">Next remembrance window</div>
        <div style={{ fontWeight: 600 }}>{windowNow.label}</div>
        <div className="small muted">{windowNow.note}</div>
        {!prefs.reminderWindows.length && (
          <Link to="/you/reminders" className="small" style={{ display: "inline-block", marginTop: 8 }}>
            Choose gentle reminder windows
          </Link>
        )}
      </section>

      <DhikrDetail dhikr={detail} onClose={() => setDetail(null)} onBegin={!completedToday && primary ? () => { setDetail(null); begin(); } : undefined} beginLabel="Begin Dhikr" />

      {session && (
        <DhikrSession
          dhikr={session.dhikr}
          target={session.target}
          context={session.context}
          lesson={session.lesson}
          reflectionPrompt={session.reflectionPrompt}
          persist={async (result) => {
            if (session.day) await store.completeJourneyDay(session.day, result);
            else await store.completeDaily(result);
          }}
          onFinished={() => {
            const finishedJourney = Boolean(session.day && view && session.day >= view.journey.lengthDays);
            setSession(null);
            if (finishedJourney) {
              track("journey_completed", {});
              navigate("/journey");
            }
          }}
          onExit={() => setSession(null)}
        />
      )}
    </div>
  );
}
