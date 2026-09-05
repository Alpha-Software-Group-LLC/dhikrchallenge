export * from "./types";
export * from "./adhkar";
export * from "./names";
export * from "./verses";
export * from "./hadith";
export * from "./pathways";
export * from "./journey";
export * from "./knowledge";

import { ADHKAR } from "./adhkar";
import { HADITHS } from "./hadith";
import { QURAN_VERSES } from "./verses";
import { NAMES_OF_ALLAH } from "./names";
import { OCCASION_LABELS } from "./pathways";
import type { DhikrItem, HadithItem, NameOfAllah, QuranVerse } from "./types";

const TOPIC_ALIASES: Record<string, string[]> = {
  difficulty: ["anxiety", "anxious", "worry", "worried", "stress", "stressed", "overwhelmed", "sad", "fear", "afraid", "scared", "calm", "peace", "hard", "hardship", "difficult", "trial", "struggle", "grief", "loss", "distress", "panic"],
  forgiveness: ["repent", "repentance", "sin", "forgive", "forgiveness", "mistake", "guilt", "guilty", "astaghfirullah", "tawbah", "istighfar", "return"],
  gratitude: ["grateful", "gratitude", "blessing", "thank", "thanks", "alhamdulillah", "praise", "hamd", "shukr"],
  general: ["dhikr", "zikr", "remember", "remembrance", "tasbeeh", "tasbih", "tasbih", "subhanallah", "subhan"],
  protection: ["protect", "protection", "refuge", "evil", "harm", "safe", "safety", "eye", "shaytan"],
  "after-salah": ["prayer", "salah", "salaah", "salat", "namaz", "after salah", "after prayer"],
  morning: ["morning", "fajr", "dawn", "sabah", "asbahna"],
  evening: ["evening", "maghrib", "night", "amsayna", "masa"],
  "before-sleep": ["sleep", "bed", "bedtime", "night", "tired"],
  "upon-waking": ["wake", "waking", "woke", "morning"],
  travel: ["travel", "journey", "trip", "car", "drive", "flight", "plane", "road"],
  provision: ["rizq", "provision", "money", "job", "work", "sustenance", "income"],
  family: ["family", "wife", "husband", "spouse", "child", "children", "kids", "parents", "marriage"],
  home: ["home", "house", "door", "leaving", "entering", "leave"],
  eating: ["eat", "eating", "food", "meal", "drink", "bismillah"],
};

const FIQH_TERMS = ["law", "fiqh", "halal", "haram", "ruling", "fatwa", "madhhab", "school", "permissible", "allowed"];

export type LibraryResult =
  | { type: "dhikr"; item: DhikrItem; score: number }
  | { type: "verse"; item: QuranVerse; score: number }
  | { type: "hadith"; item: HadithItem; score: number }
  | { type: "name"; item: NameOfAllah; score: number };

/** Normalise transliteration variants so "subhan allah", "subhanallah" and "SubhanAllah" match. */
export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[’'`ʿʾ-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function squash(s: string) {
  return normalizeQuery(s).replace(/\s/g, "");
}

/** Collapse common transliteration variants so "astagfirullah", "alhamdulilah" and "subhaan" still match. */
export function phonetic(s: string): string {
  return squash(s)
    .replace(/[^a-z]/g, "")
    .replace(/gh/g, "g")
    .replace(/kh/g, "k")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/sh/g, "s")
    .replace(/ee|ii|ea/g, "i")
    .replace(/oo|ou/g, "u")
    .replace(/aa/g, "a")
    .replace(/e/g, "i")
    .replace(/o/g, "u")
    .replace(/(.)\1+/g, "$1");
}

export function searchLibrary(query: string): { results: LibraryResult[]; fiqh: boolean; occasions: string[] } {
  const normalized = normalizeQuery(query);
  if (!normalized) return { results: [], fiqh: false, occasions: [] };
  const terms = normalized.split(" ").filter((t) => t.length > 1);
  const squashed = squash(query);
  const phon = phonetic(query);
  const occasions = Object.entries(TOPIC_ALIASES)
    .filter(([, aliases]) => aliases.some((a) => normalized.includes(a)))
    .map(([occ]) => occ);
  const fiqh = terms.some((t) => FIQH_TERMS.includes(t));

  const scoreText = (fields: string[], bonus = 0) => {
    const hay = normalizeQuery(fields.join(" "));
    const hayS = hay.replace(/\s/g, "");
    let score = 0;
    for (const t of terms) if (hay.includes(t)) score += t.length > 5 ? 3 : 1;
    if (squashed.length > 4 && hayS.includes(squashed)) score += 6;
    else if (phon.length > 4 && phonetic(hay).includes(phon)) score += 5;
    return score + bonus;
  };

  const results: LibraryResult[] = [];
  for (const d of ADHKAR) {
    const occBonus = d.occasions.some((o) => occasions.includes(o)) ? 4 : 0;
    const score = scoreText([d.title, d.transliteration, d.translation, d.explanation, d.concept ?? "", ...d.occasions.map((o) => OCCASION_LABELS[o].label), d.arabic], occBonus);
    if (score > 0) results.push({ type: "dhikr", item: d, score });
  }
  for (const v of QURAN_VERSES) {
    const themeBonus = v.themes.some((t) => occasions.includes(t) || terms.includes(t)) ? 3 : 0;
    const score = scoreText([v.reference, v.meaning, ...v.themes], themeBonus);
    if (score > 0) results.push({ type: "verse", item: v, score });
  }
  for (const h of HADITHS) {
    const score = scoreText([h.title, h.text, ...h.themes]);
    if (score > 0) results.push({ type: "hadith", item: h, score });
  }
  for (const n of NAMES_OF_ALLAH) {
    const score = scoreText([n.transliteration, n.meaning, n.reflection]);
    if (score > 0) results.push({ type: "name", item: n, score });
  }
  results.sort((a, b) => b.score - a.score);
  return { results, fiqh, occasions };
}
