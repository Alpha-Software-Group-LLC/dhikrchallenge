import { useMemo, useState } from "react";
import { ADHKAR_BY_ID, FREE_TASBIH_IDS, type DhikrItem } from "@/content";
import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { DhikrSession } from "@/components/DhikrSession";
import { Arabic, Button, IconBack } from "@/components/ui";
import { estimateMinutes, formatDuration } from "@/lib/dates";

const TARGETS = [
  { label: "33", value: 33 },
  { label: "100", value: 100 },
  { label: "Open-ended", value: 0 },
];

export function TasbihPage() {
  const { saveFreeSession, notify, home } = useStore();
  const { navigate } = useRouter();
  const [dhikrId, setDhikrId] = useState<string>(FREE_TASBIH_IDS[0]);
  const [target, setTarget] = useState<number>(33);
  const [custom, setCustom] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [session, setSession] = useState<{ dhikr: DhikrItem; target: number } | null>(null);
  const dhikr = ADHKAR_BY_ID[dhikrId]!;
  const effectiveTarget = customMode ? Math.min(Math.max(Number(custom) || 0, 0), 10000) : target;
  const recent = useMemo(() => home.sessions.filter((s) => s.kind === "free").slice(0, 5), [home.sessions]);

  return (
    <div className="page">
      <Link to="/dhikr" className="back-link">
        <IconBack /> Dhikr
      </Link>
      <header className="page-header anim-up">
        <div className="eyebrow">Free tasbih</div>
        <h1>Count, quietly.</h1>
        <p>Choose a dhikr and a target. Free sessions are private and never shared with Circles.</p>
      </header>

      <section className="anim-up d1" aria-labelledby="pick-dhikr">
        <div id="pick-dhikr" className="eyebrow green">
          Dhikr
        </div>
        <div className="stack" role="radiogroup" aria-labelledby="pick-dhikr">
          {FREE_TASBIH_IDS.map((id) => {
            const d = ADHKAR_BY_ID[id]!;
            const on = id === dhikrId;
            return (
              <button key={id} type="button" role="radio" aria-checked={on} className={`choice ${on ? "selected" : ""}`} onClick={() => setDhikrId(id)}>
                <span className="check" aria-hidden="true">
                  {on ? "✓" : ""}
                </span>
                <span style={{ flex: 1 }}>
                  {d.title}
                  <small>{d.translation}</small>
                </span>
                <Arabic text={d.arabic.length > 30 ? d.arabic.slice(0, 30) + "…" : d.arabic} size={18} color="var(--gold2)" align="right" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="anim-up d2" style={{ marginTop: 18 }} aria-labelledby="pick-target">
        <div id="pick-target" className="eyebrow green">
          Target
        </div>
        <div className="row wrap" role="radiogroup" aria-labelledby="pick-target">
          {TARGETS.map((t) => (
            <button key={t.label} type="button" role="radio" aria-checked={!customMode && target === t.value} className={`chip green ${!customMode && target === t.value ? "active" : ""}`} onClick={() => { setCustomMode(false); setTarget(t.value); }}>
              {t.label}
            </button>
          ))}
          <button type="button" role="radio" aria-checked={customMode} className={`chip green ${customMode ? "active" : ""}`} onClick={() => setCustomMode(true)}>
            Custom
          </button>
          {customMode && <input className="input" style={{ width: 120, minHeight: 40 }} inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 70" aria-label="Custom target" />}
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          {effectiveTarget > 0 ? `${effectiveTarget}× · ${estimateMinutes(effectiveTarget, dhikr.secondsPerRepetition)}` : "Count as long as you like, then finish."}
        </p>
      </section>

      <div className="anim-up d3" style={{ marginTop: 22 }}>
        <Button size="lg" block onClick={() => setSession({ dhikr, target: effectiveTarget })} disabled={customMode && !effectiveTarget}>
          Begin
        </Button>
      </div>

      {recent.length > 0 && (
        <section className="anim-up d4" style={{ marginTop: 26 }} aria-label="Recent sessions">
          <div className="eyebrow">Recent</div>
          <div className="card" style={{ padding: "4px 18px" }}>
            {recent.map((s) => (
              <div key={s.id} className="list-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{ADHKAR_BY_ID[s.dhikrId]?.title ?? s.dhikrId}</div>
                  <div className="small muted">
                    {s.count}
                    {s.target ? ` of ${s.target}` : ""} · {formatDuration(s.durationSeconds)}
                    {!s.includeInStats ? " · not counted" : ""}
                  </div>
                  {s.note && (
                    <div className="small" style={{ color: "var(--text2)", marginTop: 4, fontFamily: "var(--body)" }}>
                      {s.note}
                    </div>
                  )}
                </div>
                <span className="small muted">{s.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {session && (
        <DhikrSession
          dhikr={session.dhikr}
          target={session.target}
          context={{ kind: "free", label: "Free tasbih", contextKey: `tasbih:${session.dhikr.id}:${session.target}` }}
          persist={async () => {}}
          free={{
            onSave: async (result, include, note) => {
              await saveFreeSession(result, include, note);
              notify("Session saved.", "success");
            },
          }}
          onFinished={() => {
            setSession(null);
            navigate("/tasbih");
          }}
          onExit={() => setSession(null)}
        />
      )}
    </div>
  );
}
