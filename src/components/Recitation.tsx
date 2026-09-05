import { useEffect, useRef, useState } from "react";
import type { DhikrItem } from "@/content/types";
import { useStore } from "@/data/store";
import { IconPlay, IconPause } from "./ui";

export const AUDIO_CREDIT = "Human recitation · Hamad Al-Duraim";

function speakEnglish(text: string, onEnd: () => void) {
  if (!("speechSynthesis" in window)) return onEnd();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.82;
  u.pitch = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find((x) => x.lang.toLowerCase().startsWith("en") && x.localService) ?? voices.find((x) => x.lang.toLowerCase().startsWith("en"));
  if (v) u.voice = v;
  let fired = false;
  const done = () => {
    if (!fired) {
      fired = true;
      onEnd();
    }
  };
  u.onend = done;
  u.onerror = done;
  window.speechSynthesis.speak(u);
}

/** Plays the human Arabic recording (and optionally a calm English meaning). Never plays on tap. */
export function Recitation({ dhikr, compact }: { dhikr: DhikrItem; compact?: boolean }) {
  const { prefs } = useStore();
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<number | null>(null);
  const mode = prefs.audio;
  const canArabic = Boolean(dhikr.audio);
  const available = mode !== "off" && (canArabic || mode !== "arabic");

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (timer.current) window.clearTimeout(timer.current);
    setPlaying(false);
  };
  useEffect(() => stop, []);

  const playArabic = (onEnd: () => void) => {
    if (!dhikr.audio) return onEnd();
    const a = new Audio(dhikr.audio);
    audioRef.current = a;
    a.onended = () => {
      audioRef.current = null;
      onEnd();
    };
    a.onerror = () => {
      setError("Audio could not play.");
      onEnd();
    };
    a.play().catch(() => {
      setError("Audio could not play.");
      onEnd();
    });
  };

  const play = () => {
    if (playing) return stop();
    setError(null);
    setPlaying(true);
    const done = () => setPlaying(false);
    if (mode === "english") speakEnglish(dhikr.translation, done);
    else if (mode === "both" && canArabic) playArabic(() => (timer.current = window.setTimeout(() => speakEnglish(dhikr.translation, done), 900)));
    else if (mode === "both") speakEnglish(dhikr.translation, done);
    else playArabic(done);
  };

  if (!available) return null;
  return (
    <span className="row" style={{ gap: 6 }} onClick={(e) => e.stopPropagation()}>
      <button type="button" className={`chip ${playing ? "active" : ""}`} onClick={play} aria-label={playing ? "Stop recitation" : "Play recitation"} style={compact ? { minHeight: 30, fontSize: 12, padding: "4px 10px" } : undefined}>
        {playing ? <IconPause /> : <IconPlay />} {playing ? "Stop" : "Listen"}
      </button>
      {error && (
        <span role="status" className="small" style={{ color: "var(--rose)" }}>
          {error}
        </span>
      )}
    </span>
  );
}
