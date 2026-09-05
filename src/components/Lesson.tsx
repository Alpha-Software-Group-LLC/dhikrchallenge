import { useState } from "react";
import type { DhikrItem, KnowledgeQuestion as Q, MicroLesson } from "@/content/types";
import { useStore } from "@/data/store";
import { Button, IconCheck } from "./ui";

export function QuestionCard({ question, onAnswered }: { question: Q; onAnswered?: (correct: boolean) => void }) {
  const { answerKnowledge } = useStore();
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === question.answerIndex;
  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    const ok = i === question.answerIndex;
    void answerKnowledge(question.reinforces, ok).catch(() => {});
    onAnswered?.(ok);
  };
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.45 }}>{question.prompt}</p>
      <div className="choice-list" style={{ marginTop: 12 }} role="group" aria-label="Answer choices">
        {question.options.map((opt, i) => {
          const state = !answered ? "" : i === question.answerIndex ? "selected" : i === picked ? "wrong" : "";
          return (
            <button key={opt} type="button" className={`choice ${state}`} onClick={() => choose(i)} disabled={answered} aria-pressed={picked === i} style={state === "wrong" ? { borderColor: "rgba(217,147,143,.5)", color: "var(--rose)" } : undefined}>
              <span className="check" aria-hidden="true">
                {state === "selected" ? <IconCheck /> : ""}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={correct ? "form-note" : "form-error"} role="status" style={{ marginTop: 12, color: "var(--text)" }}>
          <strong>{correct ? "Yes." : "Not quite."}</strong> {question.explanation}
        </div>
      )}
    </div>
  );
}

export function LessonCard({ lesson, dhikr, onDone }: { lesson: MicroLesson; dhikr: DhikrItem; onDone: () => void }) {
  const [answered, setAnswered] = useState(false);
  const words = dhikr.vocabulary.slice(0, 4);
  return (
    <div className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card raised anim-up">
        <div className="eyebrow">Understand · 20 seconds</div>
        <h2 className="card-title" style={{ fontSize: 26 }}>
          {lesson.title}
        </h2>
        <p className="body-text" style={{ marginTop: 10 }}>
          {lesson.body}
        </p>
        {words.length > 0 && (
          <div className="word-grid" style={{ marginTop: 16 }}>
            {words.map((w) => (
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
      </div>
      <div className="card anim-up d1">
        <div className="eyebrow green">One question</div>
        <QuestionCard question={lesson.question} onAnswered={() => setAnswered(true)} />
      </div>
      <div className="anim-up d2">
        <Button size="lg" block onClick={onDone} variant={answered ? "primary" : "quiet"}>
          {answered ? "Continue" : "Skip for now"}
        </Button>
      </div>
    </div>
  );
}
