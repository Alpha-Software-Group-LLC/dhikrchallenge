import type { DhikrItem } from "@/content/types";
import { CONCEPTS, NAMES_BY_ID, OCCASION_LABELS } from "@/content";
import { useStore } from "@/data/store";
import { estimateMinutes } from "@/lib/dates";
import { Arabic, Button, Sheet, SourceChip } from "./ui";
import { Recitation } from "./Recitation";

interface Props {
  dhikr: DhikrItem | null;
  onClose: () => void;
  onBegin?: (dhikr: DhikrItem, target: number) => void;
  beginLabel?: string;
}

export function DhikrDetail({ dhikr, onClose, onBegin, beginLabel }: Props) {
  const { home, toggleSaved, prefs } = useStore();
  if (!dhikr) return null;
  const saved = home.savedItems.some((s) => s.itemType === "dhikr" && s.itemId === dhikr.id);
  const concept = dhikr.concept ? CONCEPTS[dhikr.concept] : null;
  const names = (dhikr.names ?? []).map((id) => NAMES_BY_ID[id]).filter(Boolean);
  return (
    <Sheet open={Boolean(dhikr)} onClose={onClose} wide>
      <div style={{ textAlign: "center" }}>
        <div className="eyebrow">{dhikr.occasions.map((o) => OCCASION_LABELS[o].label).slice(0, 2).join(" · ")}</div>
        <Arabic text={dhikr.arabic} size={dhikr.arabic.length > 80 ? 26 : Math.min(prefs.arabicSize, 38)} color="var(--text)" />
        {prefs.showTransliteration && <div className="serif" style={{ fontStyle: "italic", fontSize: 17, color: "var(--gold2)", marginTop: 6 }}>{dhikr.transliteration}</div>}
        <p style={{ color: "var(--text2)", marginTop: 8, fontSize: 15, lineHeight: 1.55 }}>{dhikr.translation}</p>
        <div className="row wrap" style={{ justifyContent: "center", marginTop: 12 }}>
          <SourceChip source={dhikr.source} virtueSource={dhikr.virtueSource} compact />
          <Recitation dhikr={dhikr} compact />
          <button type="button" className={`chip ${saved ? "active" : ""}`} style={{ minHeight: 30, fontSize: 12, padding: "4px 10px" }} onClick={() => void toggleSaved("dhikr", dhikr.id)} aria-pressed={saved}>
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {dhikr.virtue && (
        <div className="card green" style={{ marginTop: 18 }}>
          <div className="eyebrow green">Why this dhikr matters</div>
          <p className="body-text">{dhikr.virtue}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <div className="eyebrow">Meaning</div>
        <p className="body-text">{dhikr.explanation}</p>
        {dhikr.vocabulary.length > 0 && (
          <div className="word-grid" style={{ marginTop: 14 }}>
            {dhikr.vocabulary.map((w) => (
              <div className="word" key={w.arabic + w.transliteration}>
                <div className="arabic" lang="ar">
                  {w.arabic}
                </div>
                <div className="tr">{w.transliteration}</div>
                <div className="mn">{w.meaning}</div>
              </div>
            ))}
          </div>
        )}
        {(concept || names.length > 0) && (
          <div className="row wrap" style={{ marginTop: 14 }}>
            {concept && (
              <span className="pill gold" title={concept.definition}>
                {concept.label}
              </span>
            )}
            {names.map((n) => (
              <span key={n!.id} className="pill" title={n!.meaning}>
                {n!.transliteration}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="eyebrow">Carry it with you</div>
        <p className="body-text">{dhikr.practicalApplication}</p>
        <p className="serif" style={{ fontStyle: "italic", fontSize: 17, color: "var(--text2)", marginTop: 10, lineHeight: 1.6 }}>
          “{dhikr.reflectionPrompt}”
        </p>
        {dhikr.repetitionGuidance && <p className="small muted" style={{ marginTop: 8 }}>{dhikr.repetitionGuidance}</p>}
      </div>

      {onBegin && (
        <div className="actions">
          <Button size="lg" onClick={() => onBegin(dhikr, dhikr.defaultTarget)}>
            {beginLabel ?? `Begin · ${dhikr.defaultTarget}${dhikr.unit ? ` ${dhikr.unit}` : "×"} · ${estimateMinutes(dhikr.defaultTarget, dhikr.secondsPerRepetition)}`}
          </Button>
        </div>
      )}
      <p className="small muted" style={{ marginTop: 14, lineHeight: 1.6 }}>
        Explanations are study notes on the meaning of the words, not rulings. For personal guidance, ask a qualified scholar.
      </p>
    </Sheet>
  );
}
