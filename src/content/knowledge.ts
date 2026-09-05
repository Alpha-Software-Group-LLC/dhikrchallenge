import type { KnowledgeItemRef, KnowledgeItemType } from "./types";
import { ADHKAR_BY_ID } from "./adhkar";
import { NAMES_BY_ID } from "./names";
import { VERSES_BY_ID } from "./verses";
import { HADITH_BY_ID } from "./hadith";

/** Concepts the journey teaches. Written as plain definitions, not rulings. */
export const CONCEPTS: Record<string, { label: string; definition: string }> = {
  tasbih: { label: "Tasbih", definition: "Declaring Allah free of every imperfection: SubhanAllah." },
  hamd: { label: "Hamd", definition: "Praise with love and reverence for who Allah is, wider than thanks for a favour." },
  takbir: { label: "Takbir", definition: "Declaring Allah greater than everything: Allahu Akbar." },
  tawhid: { label: "Tawhid", definition: "The oneness of Allah: no deity, no partner, nothing that runs the heart but Him." },
  istighfar: { label: "Istighfar", definition: "Seeking Allah's forgiveness, asking Him to cover a wrong and protect you from its harm." },
  salawat: { label: "Salawat", definition: "Asking Allah to honour, praise and bless the Prophet ﷺ." },
  tawakkul: { label: "Tawakkul", definition: "Entrusting outcomes to Allah while doing what is yours to do." },
  tilawah: { label: "Tilawah", definition: "Recitation of the Qur'an, following its words closely." },
  tawbah: { label: "Tawbah", definition: "Turning back to Allah: regret, leaving the wrong, and resolving not to return to it." },
  sabr: { label: "Sabr", definition: "Steadfastness in hardship, obedience and restraint, held with trust in Allah." },
  rida: { label: "Rida", definition: "Contentment with Allah's decree that goes deeper than acceptance." },
  protection: { label: "Seeking refuge", definition: "Taking shelter in Allah and His Names from harm, seen and unseen." },
  barakah: { label: "Barakah", definition: "Blessing that increases and lasts, placed in a thing by Allah." },
  rizq: { label: "Rizq", definition: "Provision, reaching you through causes you did not build." },
  salah: { label: "Salah", definition: "The prescribed prayer, and the remembrances that frame it." },
  dhikr: { label: "Dhikr", definition: "Remembrance of Allah with the tongue, the heart and the limbs." },
  akhirah: { label: "Akhirah", definition: "The Hereafter: the return every morning and every journey rehearses." },
  dua: { label: "Du'a", definition: "Calling upon Allah directly; He said: I am near." },
  family: { label: "Family", definition: "Spouses and children as a trust, and a means of nearness to Allah." },
};

/** Vocabulary the journey teaches, keyed for knowledge tracking. */
export const WORDS: Record<string, { arabic: string; transliteration: string; meaning: string }> = {
  subhana: { arabic: "سُبْحَانَ", transliteration: "subhana", meaning: "far removed from imperfection" },
  "al-hamdu": { arabic: "ٱلْحَمْدُ", transliteration: "al-hamdu", meaning: "all praise" },
  akbar: { arabic: "أَكْبَرُ", transliteration: "akbar", meaning: "greater" },
  ilah: { arabic: "إِلَٰه", transliteration: "ilah", meaning: "deity, object of worship" },
  astaghfiru: { arabic: "أَسْتَغْفِرُ", transliteration: "astaghfiru", meaning: "I seek forgiveness (to be covered and protected)" },
  salli: { arabic: "صَلِّ", transliteration: "salli", meaning: "send blessings" },
  hawla: { arabic: "حَوْلَ", transliteration: "hawla", meaning: "power to change, movement" },
  quwwata: { arabic: "قُوَّةَ", transliteration: "quwwata", meaning: "strength" },
  bihamdihi: { arabic: "بِحَمْدِهِ", transliteration: "bihamdihi", meaning: "with His praise" },
  "al-mulk": { arabic: "ٱلْمُلْكُ", transliteration: "al-mulk", meaning: "dominion, ownership" },
  qadir: { arabic: "قَدِيرٌ", transliteration: "qadir", meaning: "fully able" },
  "abu'u": { arabic: "أَبُوءُ", transliteration: "abu'u", meaning: "I acknowledge, I return carrying" },
  rabb: { arabic: "رَبّ", transliteration: "rabb", meaning: "Lord: the one who owns, nurtures and sustains" },
  "al-qayyum": { arabic: "ٱلْقَيُّومُ", transliteration: "al-Qayyum", meaning: "the Self-Sustaining, by whom all things stand" },
  hasbuna: { arabic: "حَسْبُنَا", transliteration: "hasbuna", meaning: "sufficient for us" },
  barik: { arabic: "بَارِكْ", transliteration: "barik", meaning: "bless, make grow and remain" },
  nushur: { arabic: "ٱلنُّشُورُ", transliteration: "an-nushur", meaning: "the resurrection, the rising" },
  tawakkaltu: { arabic: "تَوَكَّلْتُ", transliteration: "tawakkaltu", meaning: "I have placed my trust" },
  bismi: { arabic: "بِسْمِ", transliteration: "bismi", meaning: "in the name of" },
  "al-hamm": { arabic: "ٱلْهَمِّ", transliteration: "al-hamm", meaning: "worry about what is coming" },
  "al-hazan": { arabic: "ٱلْحَزَنِ", transliteration: "al-hazan", meaning: "grief about what has passed" },
  zalimin: { arabic: "ٱلظَّالِمِينَ", transliteration: "az-zalimin", meaning: "the wrongdoers" },
  "raji'un": { arabic: "رَاجِعُونَ", transliteration: "raji'un", meaning: "those who return" },
  amutu: { arabic: "أَمُوتُ", transliteration: "amutu", meaning: "I die" },
  ahya: { arabic: "أَحْيَا", transliteration: "ahya", meaning: "I live" },
  husn: { arabic: "حُسْنِ", transliteration: "husn", meaning: "beauty, excellence" },
  hasanah: { arabic: "حَسَنَةً", transliteration: "hasanah", meaning: "good, something beautiful" },
  "qurrata-ayun": { arabic: "قُرَّةَ أَعْيُنٍ", transliteration: "qurrata a'yun", meaning: "coolness of the eyes, deep joy" },
  atubu: { arabic: "أَتُوبُ", transliteration: "atubu", meaning: "I turn in repentance" },
};

export const KNOWLEDGE_TYPES: KnowledgeItemType[] = ["dhikr", "word", "concept", "verse", "hadith", "name"];

export function parseKnowledgeId(id: string): { type: KnowledgeItemType; key: string } | null {
  const idx = id.indexOf(":");
  if (idx < 1) return null;
  const type = id.slice(0, idx) as KnowledgeItemType;
  if (!KNOWLEDGE_TYPES.includes(type)) return null;
  return { type, key: id.slice(idx + 1) };
}

/** Resolve a knowledge id to a human label. Returns null for unknown ids so stale data never crashes the UI. */
export function resolveKnowledgeItem(id: string): KnowledgeItemRef | null {
  const parsed = parseKnowledgeId(id);
  if (!parsed) return null;
  const { type, key } = parsed;
  switch (type) {
    case "dhikr": {
      const d = ADHKAR_BY_ID[key];
      return d ? { id, type, label: d.title } : null;
    }
    case "word": {
      const w = WORDS[key];
      return w ? { id, type, label: `${w.transliteration} — ${w.meaning}` } : null;
    }
    case "concept": {
      const c = CONCEPTS[key];
      return c ? { id, type, label: c.label } : null;
    }
    case "verse": {
      const v = VERSES_BY_ID[key];
      return v ? { id, type, label: v.reference } : null;
    }
    case "hadith": {
      const h = HADITH_BY_ID[key];
      return h ? { id, type, label: `${h.title} (${h.source.collection} ${h.source.reference})` } : null;
    }
    case "name": {
      const n = NAMES_BY_ID[key];
      return n ? { id, type, label: `${n.transliteration} — ${n.meaning}` } : null;
    }
  }
}

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeItemType, string> = {
  dhikr: "Adhkar learned",
  word: "Arabic words",
  concept: "Concepts",
  verse: "Qur'an verses",
  hadith: "Hadith",
  name: "Names of Allah",
};
