import type { Occasion, Pathway } from "./types";

export const OCCASION_LABELS: Record<Occasion, { label: string; hint: string }> = {
  morning: { label: "Morning", hint: "Begin the day facing Allah" },
  evening: { label: "Evening", hint: "Close the day with remembrance" },
  "after-salah": { label: "After Salah", hint: "The minutes after the taslim" },
  "before-sleep": { label: "Before Sleep", hint: "Hand the night over" },
  "upon-waking": { label: "Upon Waking", hint: "The first sentence of the day" },
  gratitude: { label: "Gratitude", hint: "Praise as a way of seeing" },
  forgiveness: { label: "Forgiveness", hint: "Return without shame" },
  difficulty: { label: "Anxiety & Difficulty", hint: "When the heart is heavy" },
  travel: { label: "Travel", hint: "On the road" },
  protection: { label: "Protection", hint: "Refuge in His Names" },
  provision: { label: "Provision", hint: "Rizq and its Source" },
  family: { label: "Family", hint: "Du'a for the people you love" },
  home: { label: "Entering & Leaving Home", hint: "At the threshold" },
  eating: { label: "Eating", hint: "Beginnings and endings" },
  general: { label: "General Remembrance", hint: "Anytime, anywhere" },
};

export const OCCASION_ORDER: Occasion[] = [
  "morning",
  "evening",
  "after-salah",
  "before-sleep",
  "upon-waking",
  "gratitude",
  "forgiveness",
  "difficulty",
  "travel",
  "protection",
  "provision",
  "family",
  "home",
  "eating",
  "general",
];

/** Curated continuation pathways offered after the 30-day journey. Every dhikr id must exist in ADHKAR. */
export const PATHWAYS: Pathway[] = [
  { id: "morning-evening", title: "Morning & Evening Adhkar", description: "A compact daily set drawn from the authenticated morning and evening remembrances.", occasion: "morning", dhikrIds: ["asbahna", "ikhlas", "ayat_al_kursi", "bismillah_protection", "radeetu", "sayyid_al_istighfar", "afw_afiyah"] },
  { id: "gratitude", title: "Gratitude", description: "Praise as a daily discipline of noticing.", occasion: "gratitude", dhikrIds: ["alhamdulillah", "waking_alhamdulillah", "after_eating", "subhanallahi_wa_bihamdihi", "rabbana_atina"] },
  { id: "tawbah", title: "Tawbah", description: "Returning to Allah as a rhythm, not an emergency.", occasion: "forgiveness", dhikrIds: ["astaghfirullah", "sayyid_al_istighfar", "istighfar_extended", "dua_of_yunus", "after_salah_salam"] },
  { id: "tawakkul", title: "Tawakkul", description: "Placing outcomes with the One who holds them.", occasion: "difficulty", dhikrIds: ["hawqala", "hasbunallah", "leaving_home", "ya_hayyu_ya_qayyum", "tahlil_full"] },
  { id: "protection", title: "Protection", description: "The remembrances of refuge.", occasion: "protection", dhikrIds: ["bismillah_protection", "audhu_bikalimat", "ikhlas", "ayat_al_kursi", "dua_anxiety"] },
  { id: "after-salah", title: "After Salah", description: "What the Prophet ﷺ said in the minutes after prayer.", occasion: "after-salah", dhikrIds: ["after_salah_salam", "subhanallah", "alhamdulillah", "allahu_akbar", "tahlil_full", "after_salah_help", "ayat_al_kursi"] },
  { id: "sleep-waking", title: "Sleep & Waking", description: "The last words of the night and the first of the morning.", occasion: "before-sleep", dhikrIds: ["ayat_al_kursi", "ikhlas", "sleep_bismika", "sleep_protection", "waking_alhamdulillah"] },
  { id: "difficult-times", title: "Difficult Times", description: "What to say when the heart is heavy.", occasion: "difficulty", dhikrIds: ["dua_of_distress", "dua_of_yunus", "istirja", "hasbunallah", "dua_anxiety"] },
  { id: "everyday", title: "Everyday Remembrance", description: "Dhikr woven into doors, meals and roads.", occasion: "general", dhikrIds: ["leaving_home", "bismillah_eating", "after_eating", "travel", "family_dua", "salawat"] },
];
