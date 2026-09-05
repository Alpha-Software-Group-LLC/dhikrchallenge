import type { QuranVerse } from "./types";

/** Concise notes pointing to passages. They are study aids, not translations or tafsir. */
export const QURAN_VERSES: QuranVerse[] = [
  { id: "v-2-152", reference: "Qur'an 2:152", arabic: "فَٱذْكُرُونِىٓ أَذْكُرْكُمْ", meaning: "Remember Me; I will remember you. Be grateful to Me and do not deny Me.", themes: ["dhikr", "gratitude", "closeness"], reviewStatus: "approved" },
  { id: "v-13-28", reference: "Qur'an 13:28", arabic: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ", meaning: "Truly, in the remembrance of Allah do hearts find rest.", themes: ["peace", "anxiety", "dhikr", "heart"], reviewStatus: "approved" },
  { id: "v-39-53", reference: "Qur'an 39:53", meaning: "Do not despair of Allah's mercy. The verse addresses those who have wronged themselves and calls them back; Allah forgives all sins, for He is Al-Ghafur, Ar-Rahim.", themes: ["sin", "repentance", "despair", "forgiveness"], reviewStatus: "approved" },
  { id: "v-94-5", reference: "Qur'an 94:5–6", meaning: "With hardship comes ease. Repeated twice, as comfort, not as a claim that the hardship is imaginary.", themes: ["hardship", "patience", "hope"], reviewStatus: "approved" },
  { id: "v-2-286", reference: "Qur'an 2:286", meaning: "Allah does not burden a soul beyond its capacity. The verse closes with a prayer for help, forgiveness and mercy.", themes: ["stress", "responsibility", "hardship", "capacity"], reviewStatus: "approved" },
  { id: "v-3-159", reference: "Qur'an 3:159", meaning: "Consult, decide, and then place your reliance upon Allah; He loves those who rely on Him.", themes: ["decision", "effort", "tawakkul", "trust"], reviewStatus: "approved" },
  { id: "v-33-41", reference: "Qur'an 33:41–42", arabic: "يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱذْكُرُوا۟ ٱللَّهَ ذِكْرًا كَثِيرًا", meaning: "O you who believe, remember Allah with much remembrance, and glorify Him morning and evening.", themes: ["dhikr", "morning", "evening", "consistency"], reviewStatus: "approved" },
  { id: "v-2-186", reference: "Qur'an 2:186", meaning: "When My servants ask you about Me: I am near. I respond to the call of the caller when he calls upon Me.", themes: ["dua", "closeness", "hope"], reviewStatus: "approved" },
  { id: "v-29-45", reference: "Qur'an 29:45", meaning: "Prayer restrains from shameful and wrong deeds, and the remembrance of Allah is greater.", themes: ["dhikr", "prayer", "character"], reviewStatus: "approved" },
  { id: "v-3-173", reference: "Qur'an 3:173", meaning: "Allah is sufficient for us, and He is the best Disposer of affairs. Said by believers who were warned of an army gathered against them.", themes: ["fear", "tawakkul", "sufficiency"], reviewStatus: "approved" },
  { id: "v-21-87", reference: "Qur'an 21:87", meaning: "The call of Yunus from the darkness: There is no god but You, glory be to You, I have been among the wrongdoers.", themes: ["distress", "repentance", "darkness"], reviewStatus: "approved" },
  { id: "v-65-3", reference: "Qur'an 65:3", meaning: "Whoever relies upon Allah, He is sufficient for him. Allah will accomplish His purpose.", themes: ["tawakkul", "provision", "trust"], reviewStatus: "approved" },
  { id: "v-62-10", reference: "Qur'an 62:10", meaning: "Disperse in the land, seek Allah's bounty, and remember Allah much, that you may succeed.", themes: ["work", "dhikr", "provision", "success"], reviewStatus: "approved" },
  { id: "v-7-205", reference: "Qur'an 7:205", meaning: "Remember your Lord within yourself, humbly and with awe, without loudness, in the morning and the evening, and do not be among the heedless.", themes: ["dhikr", "morning", "evening", "humility"], reviewStatus: "approved" },
  { id: "v-15-9", reference: "Qur'an 15:9", meaning: "It is We who sent down the Dhikr (the Qur'an), and We are its Guardian.", themes: ["quran", "dhikr", "protection"], reviewStatus: "approved" },
  { id: "v-39-42", reference: "Qur'an 39:42", meaning: "Allah takes the souls at death, and those that do not die during their sleep; He keeps those for which He has decreed death and releases the others until an appointed time.", themes: ["sleep", "death", "trust"], reviewStatus: "approved" },
];

export const VERSES_BY_ID: Record<string, QuranVerse> = Object.fromEntries(QURAN_VERSES.map((v) => [v.id, v]));
