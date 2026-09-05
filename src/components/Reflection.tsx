import { useState } from "react";
import { Button } from "./ui";

export const MOODS: [string, string][] = [
  ["peaceful", "Peaceful"],
  ["grateful", "Grateful"],
  ["reflective", "Reflective"],
  ["focused", "Focused"],
  ["hopeful", "Hopeful"],
  ["heavy", "Heavy"],
];

export function ReflectionForm({ prompt, onSave, onSkip }: { prompt: string; onSave: (mood: string, note: string) => Promise<void>; onSkip: () => void }) {
  const [mood, setMood] = useState("reflective");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card raised anim-up">
        <div className="eyebrow">Reflect · private</div>
        <h2 className="card-title" style={{ fontSize: 26 }}>
          {prompt}
        </h2>
        <p className="small muted" style={{ marginTop: 8 }}>
          Nobody sees this but you. One sentence is enough.
        </p>
        <div className="chip-row" style={{ marginTop: 16 }} role="group" aria-label="How did this feel">
          {MOODS.map(([v, l]) => (
            <button key={v} type="button" className={`chip green ${mood === v ? "active" : ""}`} onClick={() => setMood(v)} aria-pressed={mood === v}>
              {l}
            </button>
          ))}
        </div>
        <label className="field">
          <span>
            A private note <small>(optional)</small>
          </span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} placeholder="One line to carry forward…" />
        </label>
      </div>
      <div className="stack anim-up d1">
        <Button
          size="lg"
          block
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(mood, note);
            } finally {
              setBusy(false);
            }
          }}
        >
          Save reflection
        </Button>
        <Button variant="ghost" block onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  );
}
