import { useState } from "react";
import { useStore } from "@/data/store";
import { useRouter } from "@/components/router";
import { Arabic, Button } from "@/components/ui";
import { STRONGER_HEART, ADHKAR_BY_ID } from "@/content";
import { track } from "@/lib/analytics";
import { friendlyError } from "@/data/backend";
import type { Routine } from "@/data/types";

const GOALS = ["Remember Allah more consistently", "Learn authentic adhkar", "Understand what I already recite", "Build a routine", "Remember Allah with family or friends"];
const ROUTINES: { id: Routine; label: string }[] = [
  { id: "starting", label: "I'm just getting started" },
  { id: "occasionally", label: "Occasionally" },
  { id: "most-days", label: "Most days" },
  { id: "consistent", label: "Already consistent" },
];
const DURATIONS = [
  { value: 1, label: "1 minute", note: "One short dhikr" },
  { value: 3, label: "3 minutes", note: "Recommended to begin" },
  { value: 5, label: "5 minutes", note: "Room to slow down" },
];

export function OnboardingPage() {
  const { savePreferences, startJourney, home, notify } = useStore();
  const { navigate } = useRouter();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [duration, setDuration] = useState(3);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const day1 = ADHKAR_BY_ID.subhanallah!;

  const finish = async () => {
    setBusy(true);
    try {
      const d = custom ? Math.min(30, Math.max(1, Number(custom) || 3)) : duration;
      await savePreferences({ goals, routine: routine ?? "starting", duration: d, onboardingCompleted: true });
      if (!home.journey) await startJourney(STRONGER_HEART.id);
      track("onboarding_completed", { goals: goals.length, routine: routine ?? "starting", duration: d });
      navigate("/?begin=1", { replace: true });
    } catch (e) {
      notify(friendlyError(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="progress" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i <= step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <div className="anim-up">
          <Arabic text="ٱلسَّلَامُ عَلَيْكُمْ" size={26} color="var(--gold)" align="left" />
          <h1 style={{ marginTop: 10 }}>Welcome.</h1>
          <p className="lead">What would you like Dhikr Challenge to help you with? Choose as many as you like.</p>
          <div className="choice-list" role="group" aria-label="Goals">
            {GOALS.map((g) => {
              const on = goals.includes(g);
              return (
                <button key={g} type="button" className={`choice ${on ? "selected" : ""}`} aria-pressed={on} onClick={() => setGoals((s) => (on ? s.filter((x) => x !== g) : [...s, g]))}>
                  <span className="check" aria-hidden="true">
                    {on ? "✓" : ""}
                  </span>
                  <span>{g}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="anim-up">
          <h1>Where are you today?</h1>
          <p className="lead">How would you describe your current dhikr routine? There is no wrong answer.</p>
          <div className="choice-list" role="radiogroup" aria-label="Current routine">
            {ROUTINES.map((r) => (
              <button key={r.id} type="button" role="radio" aria-checked={routine === r.id} className={`choice ${routine === r.id ? "selected" : ""}`} onClick={() => setRoutine(r.id)}>
                <span className="check" aria-hidden="true">
                  {routine === r.id ? "✓" : ""}
                </span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="anim-up">
          <h1>Start small. Stay consistent.</h1>
          <p className="lead">The most beloved deeds are the most consistent, even if small. How long each day feels right?</p>
          <div className="choice-list" role="radiogroup" aria-label="Daily commitment">
            {DURATIONS.map((d) => (
              <button key={d.value} type="button" role="radio" aria-checked={!custom && duration === d.value} className={`choice ${!custom && duration === d.value ? "selected" : ""}`} onClick={() => { setCustom(""); setDuration(d.value); }}>
                <span className="check" aria-hidden="true">
                  {!custom && duration === d.value ? "✓" : ""}
                </span>
                <span>
                  {d.label}
                  <small>{d.note}</small>
                </span>
              </button>
            ))}
            <label className={`choice ${custom ? "selected" : ""}`} style={{ cursor: "text" }}>
              <span className="check" aria-hidden="true">
                {custom ? "✓" : ""}
              </span>
              <span style={{ flex: 1 }}>Custom</span>
              <input className="input" style={{ width: 90, minHeight: 40 }} inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="min" aria-label="Custom minutes" />
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="anim-up">
          <div className="eyebrow">Day 1 · {STRONGER_HEART.weeks[0]!.title}</div>
          <h1>Begin Day 1.</h1>
          <p className="lead">Thirty-three SubhanAllah. About two minutes. Then a twenty-second lesson on what you just said.</p>
          <div className="card raised gold" style={{ textAlign: "center" }}>
            <Arabic text={day1.arabic} size={40} color="var(--text)" />
            <div className="serif" style={{ fontStyle: "italic", color: "var(--gold2)", fontSize: 18, marginTop: 6 }}>
              {day1.transliteration}
            </div>
            <div className="small" style={{ color: "var(--text2)", marginTop: 4 }}>
              {day1.translation}
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 14, lineHeight: 1.6 }}>
            Notifications, Circles and everything else can wait. First, the dhikr.
          </p>
        </div>
      )}

      <div className="foot">
        {step < 3 ? (
          <Button size="lg" block onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !routine}>
            Continue
          </Button>
        ) : (
          <Button size="lg" block loading={busy} onClick={finish}>
            Begin Dhikr
          </Button>
        )}
        {step > 0 ? (
          <Button variant="ghost" block onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <Button variant="ghost" block onClick={() => setStep(3)}>
            Skip to Day 1
          </Button>
        )}
      </div>
    </div>
  );
}
