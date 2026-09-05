import { useState } from "react";
import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { Button, IconBack } from "@/components/ui";
import { friendlyError } from "@/data/backend";
import { track } from "@/lib/analytics";
import { STRONGER_HEART } from "@/content";
import type { Visibility } from "@/data/types";

export const VISIBILITY_OPTIONS: { id: Visibility; label: string; note: string }[] = [
  { id: "private", label: "Private", note: "Nobody sees your individual activity. You contribute anonymously to Circle totals." },
  { id: "completion", label: "Completion only", note: "Members see whether you completed today's dhikr, never your count." },
  { id: "shared", label: "Shared", note: "Members also see your journey day and what you've learned." },
];

const SUGGESTIONS = ["My Family", "Brothers", "Sisters", "Cousins", "Husband & Wife", "College Friends", "Masjid Youth", "Ramadan Crew"];

export function CircleNewPage() {
  const { backend, notify, mode, today, updateHome } = useStore();
  const { navigate } = useRouter();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("completion");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (mode === "guest") {
    navigate("/circles", { replace: true });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Give your Circle a name of at least two characters.");
    setBusy(true);
    setError(null);
    try {
      const created = await backend.createCircle(name.trim(), purpose.trim() || null);
      if (visibility !== "completion") await backend.setMyVisibility(created.id, visibility);
      const circles = await backend.listCircles(today);
      updateHome((h) => ({ ...h, circles }));
      track("circle_created", {});
      notify("Your Circle is ready. Invite the people you love.", "success");
      navigate(`/circles/${created.id}?invite=1`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <Link to="/circles" className="back-link">
        <IconBack /> Circles
      </Link>
      <header className="page-header anim-up">
        <div className="eyebrow">New Circle</div>
        <h1>Who will you remember with?</h1>
        <p>A Circle is private and invite-only. Only people with your invite can join.</p>
      </header>
      <form onSubmit={submit} className="anim-up d1">
        <label className="field">
          <span>Circle name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Qureshi Family" autoFocus required />
        </label>
        <div className="chip-row" style={{ marginTop: 8 }} aria-label="Suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => setName(s)}>
              {s}
            </button>
          ))}
        </div>
        <label className="field">
          <span>
            Purpose <small>(optional)</small>
          </span>
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={140} placeholder="Remember Allah together every day." />
        </label>

        <div className="field">
          <span>Challenge</span>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600 }}>{STRONGER_HEART.title}</div>
            <div className="small muted">Each member walks their own thirty days. The Circle shows who showed up today.</div>
          </div>
        </div>

        <fieldset className="field" style={{ border: 0 }}>
          <legend style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 7 }}>What this Circle sees about you</legend>
          <div className="choice-list">
            {VISIBILITY_OPTIONS.map((o) => (
              <button key={o.id} type="button" className={`choice ${visibility === o.id ? "selected" : ""}`} onClick={() => setVisibility(o.id)} aria-pressed={visibility === o.id}>
                <span className="check" aria-hidden="true">
                  {visibility === o.id ? "✓" : ""}
                </span>
                <span>
                  {o.label}
                  <small>{o.note}</small>
                </span>
              </button>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            You can change this any time. Counts, free sessions and reflections are never shared.
          </p>
        </fieldset>

        {error && <div className="form-error">{error}</div>}
        <div style={{ marginTop: 22 }}>
          <Button type="submit" size="lg" block loading={busy}>
            Create Circle
          </Button>
        </div>
      </form>
    </div>
  );
}
