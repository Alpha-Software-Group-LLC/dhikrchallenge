import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DhikrItem, MicroLesson } from "@/content/types";
import type { SessionResult } from "@/data/types";
import { useStore } from "@/data/store";
import { haptic, prefersReducedMotion, requestWakeLock, softTick } from "@/lib/device";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";
import { localDateStr, formatDuration } from "@/lib/dates";
import { track } from "@/lib/analytics";
import { Button, IconBack, IconPause, IconPlay, IconSound, IconSun, IconUndo, SourceChip, Sheet, Arabic } from "./ui";
import { Recitation } from "./Recitation";
import { LessonCard } from "./Lesson";
import { ReflectionForm } from "./Reflection";

export type SessionContext =
  | { kind: "journey"; day: number; label: string; contextKey: string }
  | { kind: "daily"; label: string; contextKey: string }
  | { kind: "free"; label: string; contextKey: string };

interface Props {
  dhikr: DhikrItem;
  target: number;
  context: SessionContext;
  lesson?: MicroLesson;
  reflectionPrompt?: string;
  /** Persist the completed session. Throwing shows an error and keeps the completion screen. */
  persist: (result: SessionResult) => Promise<void>;
  onFinished: () => void;
  onExit: () => void;
  /** Free mode: allow finishing early and include-in-stats toggle. */
  free?: { onSave: (result: SessionResult, includeInStats: boolean, note: string | null) => Promise<void> };
}

interface Saved {
  count: number;
  elapsed: number;
}

const COMPLETION_VERSES = [
  { text: "Remember Me; I will remember you.", cite: "Qur'an 2:152" },
  { text: "Truly, in the remembrance of Allah do hearts find rest.", cite: "Qur'an 13:28" },
  { text: "Remember Allah with much remembrance.", cite: "Qur'an 33:41" },
  { text: "The most beloved deeds to Allah are the most consistent, even if small.", cite: "Sahih al-Bukhari 6465" },
];

type Stage = "count" | "complete" | "lesson" | "reflect";

export function DhikrSession({ dhikr, target, context, lesson, reflectionPrompt, persist, onFinished, onExit, free }: Props) {
  const { prefs, savePreferences, notify, encounterKnowledge, saveReflection, mode } = useStore();
  const storageKey = `dhikr:session:${context.contextKey}:${localDateStr()}`;
  const [count, setCount] = useState<number>(() => Math.min(readJSON<Saved>(storageKey, { count: 0, elapsed: 0 }).count, Math.max(target - 1, 0)));
  const [elapsed, setElapsed] = useState<number>(() => readJSON<Saved>(storageKey, { count: 0, elapsed: 0 }).elapsed);
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState<Stage>("count");
  const [pulse, setPulse] = useState(0);
  const [ripples, setRipples] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTranslit, setShowTranslit] = useState(prefs.showTransliteration);
  const [showMeaning, setShowMeaning] = useState(true);
  const [arabicSize, setArabicSize] = useState(prefs.arabicSize);
  const [keepAwake, setKeepAwake] = useState(prefs.keepAwake);
  const [sound, setSound] = useState(prefs.sound);
  const [infoOpen, setInfoOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [includeInStats, setIncludeInStats] = useState(prefs.freeSessionsInStats);
  const [note, setNote] = useState("");
  const tapLock = useRef(false);
  const releaseWake = useRef<(() => void) | null>(null);
  const verse = useMemo(() => COMPLETION_VERSES[(dhikr.id.length + target) % COMPLETION_VERSES.length]!, [dhikr.id, target]);
  const openEnded = target === 0;
  const done = !openEnded && count >= target;
  const reduced = prefersReducedMotion();

  useEffect(() => {
    track("dhikr_session_started", { kind: context.kind, dhikrId: dhikr.id, target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer: counts only while counting and not paused.
  useEffect(() => {
    if (stage !== "count" || paused) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [stage, paused]);

  // Persist count for accidental refresh.
  useEffect(() => {
    if (stage === "count") writeJSON(storageKey, { count, elapsed });
  }, [count, elapsed, stage, storageKey]);

  // Wake lock
  useEffect(() => {
    let alive = true;
    if (keepAwake && stage === "count") {
      void requestWakeLock().then((release) => {
        if (!alive) release?.();
        else releaseWake.current = release;
      });
    }
    return () => {
      alive = false;
      releaseWake.current?.();
      releaseWake.current = null;
    };
  }, [keepAwake, stage]);

  const increment = useCallback(() => {
    if (stage !== "count" || paused || done) return;
    // A short lock only guards against a single physical tap registering twice.
    if (tapLock.current) return;
    tapLock.current = true;
    window.setTimeout(() => (tapLock.current = false), 30);
    setCount((c) => {
      const next = openEnded ? c + 1 : Math.min(c + 1, target);
      if (!openEnded && next >= target) {
        haptic([18, 40, 18]);
        removeKey(storageKey);
        window.setTimeout(() => setStage("complete"), 520);
      } else if (prefs.haptics) haptic(12);
      return next;
    });
    if (sound) softTick();
    setPulse((p) => p + 1);
    if (!reduced) {
      const id = Date.now();
      setRipples((r) => [...r.slice(-2), id]);
      window.setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 700);
    }
  }, [stage, paused, done, openEnded, target, prefs.haptics, sound, reduced, storageKey]);

  const undo = useCallback(() => {
    if (stage !== "count") return;
    setCount((c) => Math.max(0, c - 1));
    if (prefs.haptics) haptic(8);
  }, [stage, prefs.haptics]);

  // Keyboard: Space/Enter/ArrowUp count; Backspace undo; P pause; Escape exit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (stage !== "count") return;
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "+") {
        e.preventDefault();
        increment();
      } else if (e.key === "Backspace" || e.key === "ArrowDown" || e.key === "-") {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === "p") setPaused((p) => !p);
      else if (e.key === "Escape") setExitConfirm(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [increment, undo, stage]);

  const result: SessionResult = { dhikrId: dhikr.id, target, count, durationSeconds: elapsed };

  const finishFree = async () => {
    if (!free) return;
    setSaving(true);
    setSaveError(null);
    try {
      await free.onSave({ ...result }, includeInStats, note.trim() || null);
      removeKey(storageKey);
      onFinished();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save this session.");
    } finally {
      setSaving(false);
    }
  };

  // Persist as soon as the target is reached (journey / daily).
  const persisted = useRef(false);
  useEffect(() => {
    if (stage !== "complete" || persisted.current || free) return;
    persisted.current = true;
    setSaving(true);
    persist(result)
      .then(() => setSaveError(null))
      .catch((e) => {
        persisted.current = false;
        setSaveError(e instanceof Error ? e.message : "Could not save your completion.");
      })
      .finally(() => setSaving(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const retryPersist = () => {
    persisted.current = false;
    setStage("count");
    window.setTimeout(() => setStage("complete"), 0);
  };

  const toggleSetting = (key: "keepAwake" | "sound" | "showTransliteration", value: boolean) => {
    if (key === "keepAwake") setKeepAwake(value);
    if (key === "sound") setSound(value);
    if (key === "showTransliteration") setShowTranslit(value);
    void savePreferences({ [key]: value }).catch(() => {});
  };

  const changeArabicSize = (delta: number) => {
    const next = Math.min(64, Math.max(26, arabicSize + delta));
    setArabicSize(next);
    void savePreferences({ arabicSize: next }).catch(() => {});
  };

  const progress = openEnded ? 0 : count / target;
  const arabicFont = Math.min(arabicSize, dhikr.arabic.length > 200 ? 26 : dhikr.arabic.length > 80 ? 30 : dhikr.arabic.length > 40 ? 34 : arabicSize);

  if (stage === "complete") {
    return (
      <div className="session" role="dialog" aria-label="Session complete">
        <div className="session-top">
          <span />
        </div>
        <div className="session-body">
          <div className="completion anim-in">
            <div className="alhamdulillah" lang="ar">
              ٱلْحَمْدُ لِلَّهِ
            </div>
            <h2>Alhamdulillah.</h2>
            <div className="count">
              {count} / {openEnded ? count : target}
              {elapsed > 0 && <span className="muted"> · {formatDuration(elapsed)}</span>}
            </div>
            <blockquote>
              “{verse.text}”<cite>{verse.cite}</cite>
            </blockquote>
            {saving && <p className="small muted" style={{ marginTop: 14 }}>Saving your completion…</p>}
            {saveError && (
              <div className="form-error" style={{ marginTop: 14, textAlign: "left" }}>
                {saveError}
                <div style={{ marginTop: 8 }}>
                  <Button size="sm" variant="quiet" onClick={retryPersist}>
                    Try saving again
                  </Button>
                </div>
              </div>
            )}
            {free && (
              <div style={{ marginTop: 20, textAlign: "left" }}>
                <div className="switch-row">
                  <div>
                    <div className="label">Count toward my progress</div>
                    <div className="hint">Free sessions are never shared with Circles.</div>
                  </div>
                  <button type="button" role="switch" aria-checked={includeInStats} aria-label="Count toward my progress" className="switch" onClick={() => setIncludeInStats((v) => !v)} />
                </div>
                <label className="field">
                  <span>
                    Private note <small>(optional)</small>
                  </span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="One line to remember from this session…" rows={2} />
                </label>
              </div>
            )}
          </div>
        </div>
        <div className="stack anim-up d2" style={{ position: "relative", zIndex: 2 }}>
          {free ? (
            <Button size="lg" block onClick={finishFree} loading={saving}>
              Save session
            </Button>
          ) : lesson ? (
            <Button
              size="lg"
              block
              disabled={saving || !!saveError}
              onClick={() => {
                setStage("lesson");
                void encounterKnowledge([`dhikr:${dhikr.id}`, ...lesson.introduces]);
                track("lesson_viewed", { lessonId: lesson.id });
              }}
            >
              Learn what you just said
            </Button>
          ) : null}
          {!free && (
            <Button variant="quiet" block disabled={saving || !!saveError} onClick={() => (reflectionPrompt ? setStage("reflect") : onFinished())}>
              {reflectionPrompt ? "Continue" : "Done"}
            </Button>
          )}
          {free && (
            <Button variant="ghost" block onClick={onExit}>
              Discard
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (stage === "lesson" && lesson) {
    return (
      <div className="session" role="dialog" aria-label="Micro lesson">
        <div className="session-top">
          <button type="button" className="icon-btn" onClick={() => setStage("complete")} aria-label="Back">
            <IconBack />
          </button>
          <span className="small muted">Understand</span>
          <span style={{ width: 44 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 2, paddingTop: 12 }}>
          <LessonCard lesson={lesson} dhikr={dhikr} onDone={() => (reflectionPrompt ? setStage("reflect") : onFinished())} />
        </div>
      </div>
    );
  }

  if (stage === "reflect" && reflectionPrompt) {
    return (
      <div className="session" role="dialog" aria-label="Reflection">
        <div className="session-top">
          <span />
          <span className="small muted">Reflect</span>
          <span />
        </div>
        <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 2, paddingTop: 12 }}>
          <ReflectionForm
            prompt={reflectionPrompt}
            onSkip={onFinished}
            onSave={async (mood, text) => {
              try {
                await saveReflection(dhikr.id, mood, text);
                notify("Reflection saved privately.", "success");
              } catch (e) {
                notify(e instanceof Error ? e.message : "Reflection could not be saved.", "error");
                return;
              }
              onFinished();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="session" role="dialog" aria-label={`Dhikr session: ${dhikr.title}`}>
      <div className="session-top">
        <button type="button" className="icon-btn" onClick={() => (count > 0 ? setExitConfirm(true) : onExit())} aria-label="Leave session">
          <IconBack />
        </button>
        <div style={{ textAlign: "center", minWidth: 0 }}>
          <div className="small" style={{ color: "var(--gold)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
            {context.label}
          </div>
          {elapsed > 0 && (
            <div className="small muted" aria-live="off">
              {formatDuration(elapsed)}
              {paused ? " · paused" : ""}
            </div>
          )}
        </div>
        <button type="button" className={`icon-btn ${paused ? "active" : ""}`} onClick={() => setPaused((p) => !p)} aria-label={paused ? "Resume" : "Pause"} aria-pressed={paused}>
          {paused ? <IconPlay /> : <IconPause />}
        </button>
      </div>

      <div className="session-body">
        <div className="session-text">
          <div className="session-arabic anim-in" style={{ fontSize: arabicFont }} lang="ar">
            {dhikr.arabic}
          </div>
          {showTranslit && <div className="session-translit anim-in d1" style={dhikr.arabic.length > 120 ? { fontSize: 14 } : undefined}>{dhikr.transliteration}</div>}
          {showMeaning && <div className="session-meaning anim-in d2">{dhikr.translation}</div>}
        </div>
        <div className="row" style={{ gap: 6, marginTop: 4 }}>
          <SourceChip source={dhikr.source} virtueSource={dhikr.virtueSource} compact />
          <Recitation dhikr={dhikr} compact />
        </div>

        <button
          type="button"
          className="tap-zone"
          onPointerDown={(e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            e.preventDefault();
            increment();
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") e.preventDefault();
          }}
          aria-label={openEnded ? `Count ${count}. Activate to add one.` : `Count ${count} of ${target}. Activate to add one.`}
          disabled={paused}
        >
          {ripples.map((id) => (
            <span key={id} className="ripple-ring" aria-hidden="true" />
          ))}
          <div className="ring-wrap">
            <svg width="100%" height="100%" viewBox="0 0 232 232" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden="true">
              <circle cx="116" cy="116" r="108" fill="none" stroke="var(--ring-track)" strokeWidth="6" />
              {!openEnded && <circle cx="116" cy="116" r="108" fill="none" stroke={done ? "var(--gold)" : "var(--green2)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 108} strokeDashoffset={2 * Math.PI * 108 * (1 - progress)} style={{ transition: "stroke-dashoffset 0.35s var(--ease)" }} />}
            </svg>
            <div style={{ textAlign: "center" }}>
              <div key={pulse} className={`session-count ${pulse && !reduced ? "pulse" : ""}`} aria-hidden="true">
                {count}
              </div>
              <div className="session-target" aria-hidden="true">
                {openEnded ? "open-ended" : `of ${target}${dhikr.unit ? ` ${dhikr.unit}` : ""}`}
              </div>
            </div>
          </div>
          <div className="tap-hint" aria-hidden="true">
            {paused ? "Paused" : count === 0 ? "Tap anywhere here to count" : ""}
          </div>
        </button>
      </div>

      <div className="session-controls">
        <button type="button" className="icon-btn" onClick={undo} disabled={count === 0 || paused} aria-label="Undo last count">
          <IconUndo /> Undo
        </button>
        <button type="button" className={`icon-btn ${sound ? "active" : ""}`} onClick={() => toggleSetting("sound", !sound)} aria-pressed={sound} aria-label="Toggle sound">
          <IconSound off={!sound} />
        </button>
        <button type="button" className={`icon-btn ${keepAwake ? "active" : ""}`} onClick={() => toggleSetting("keepAwake", !keepAwake)} aria-pressed={keepAwake} aria-label="Keep screen awake">
          <IconSun />
        </button>
        <button type="button" className="icon-btn" onClick={() => setInfoOpen(true)} aria-label="Display options">
          Aa
        </button>
        {openEnded && free && (
          <Button size="sm" variant="secondary" onClick={() => setStage("complete")} disabled={count === 0}>
            Finish
          </Button>
        )}
      </div>

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title="Display">
        <div className="switch-row">
          <div className="label">Transliteration</div>
          <button type="button" role="switch" aria-checked={showTranslit} aria-label="Show transliteration" className="switch" onClick={() => toggleSetting("showTransliteration", !showTranslit)} />
        </div>
        <div className="switch-row">
          <div className="label">Translation</div>
          <button type="button" role="switch" aria-checked={showMeaning} aria-label="Show translation" className="switch" onClick={() => setShowMeaning((v) => !v)} />
        </div>
        <div className="switch-row">
          <div className="label">Arabic size</div>
          <div className="row">
            <button type="button" className="icon-btn" onClick={() => changeArabicSize(-4)} aria-label="Smaller Arabic">
              A−
            </button>
            <button type="button" className="icon-btn" onClick={() => changeArabicSize(4)} aria-label="Larger Arabic">
              A+
            </button>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Arabic text={dhikr.arabic} size={Math.min(arabicSize, 40)} />
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>
          Keyboard: Space or Enter counts, Backspace undoes, P pauses, Esc leaves.
        </p>
      </Sheet>

      <Sheet open={exitConfirm} onClose={() => setExitConfirm(false)} title="Leave for now?">
        <p className="body-text" style={{ color: "var(--text2)" }}>
          Your count of {count} stays on this device today. You can return and continue where you left off.
        </p>
        <div className="actions">
          <Button variant="quiet" onClick={() => setExitConfirm(false)}>
            Keep going
          </Button>
          <Button onClick={onExit}>Leave</Button>
        </div>
        {mode === "guest" && <p className="small muted" style={{ marginTop: 12 }}>Guest progress lives on this device only.</p>}
      </Sheet>
    </div>
  );
}
