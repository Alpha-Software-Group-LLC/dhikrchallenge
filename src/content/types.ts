/**
 * Curated religious content model.
 *
 * Every record here is human-authored and reviewable. Nothing is generated at
 * runtime. `reviewStatus` is an internal governance field: "approved" means
 * the reference and grading were verified by the content author against the
 * named collection; "review" flags an item whose reference or grading should be
 * confirmed by a qualified reviewer before it is treated as settled. Items in
 * review are still shown with their stated reference, never with an invented one.
 */

export type SourceType = "quran" | "hadith" | "practice";

export type ReviewStatus = "draft" | "review" | "approved" | "published" | "archived";

export interface Source {
  type: SourceType;
  /** Collection name for hadith (e.g. "Sahih al-Bukhari") or "Qur'an". */
  collection: string;
  /** Hadith number, or surah:ayah for the Qur'an. */
  reference: string;
  /** Authenticity grading where relevant and known ("sahih", "hasan sahih (Tirmidhi)"). */
  grade?: string;
  /** Free-text note about the source path or grading disagreement. */
  note?: string;
}

export type Occasion =
  | "morning"
  | "evening"
  | "after-salah"
  | "before-sleep"
  | "upon-waking"
  | "gratitude"
  | "forgiveness"
  | "difficulty"
  | "travel"
  | "protection"
  | "provision"
  | "family"
  | "home"
  | "eating"
  | "general";

export interface VocabularyWord {
  arabic: string;
  transliteration: string;
  meaning: string;
  /** Trilateral root or short linguistic note. */
  note?: string;
}

export interface DhikrItem {
  id: string;
  /** Short display name used in lists and knowledge tracking. */
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: Source;
  /** Source of the virtue statement when it differs from the text's own source. */
  virtueSource?: Source;
  occasions: Occasion[];
  /** Transmitted virtue or benefit, written as a paraphrase with its reference. */
  virtue?: string;
  /** Meaning-first explanation, contemplative not preachy. */
  explanation: string;
  vocabulary: VocabularyWord[];
  /** Related Qur'anic concept, named simply. */
  concept?: string;
  /** ids from NAMES_OF_ALLAH that this dhikr draws on. */
  names?: string[];
  reflectionPrompt: string;
  practicalApplication: string;
  /** Suggested repetitions for a session. */
  defaultTarget: number;
  /** Unit label when repetitions are not "times" (e.g. ayahs). */
  unit?: string;
  /** Approximate seconds per repetition, used to estimate session time. */
  secondsPerRepetition: number;
  /** Public path to human-recorded audio when available. */
  audio?: string;
  /** Guidance about how the text is usually repeated. */
  repetitionGuidance?: string;
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface NameOfAllah {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  source: Source;
  reflection: string;
  reviewStatus: ReviewStatus;
}

export interface QuranVerse {
  id: string;
  reference: string;
  arabic?: string;
  meaning: string;
  themes: string[];
  reviewStatus: ReviewStatus;
}

export interface HadithItem {
  id: string;
  title: string;
  text: string;
  source: Source;
  themes: string[];
  reviewStatus: ReviewStatus;
}

export interface KnowledgeQuestion {
  id: string;
  prompt: string;
  options: [string, string, string];
  answerIndex: 0 | 1 | 2;
  explanation: string;
  /** Knowledge item ids this question reinforces. */
  reinforces: string[];
}

export interface MicroLesson {
  id: string;
  title: string;
  body: string;
  /** Knowledge item ids introduced (concepts, vocabulary, names, verses). */
  introduces: string[];
  question: KnowledgeQuestion;
}

export interface JourneyDay {
  day: number;
  dhikrId: string;
  target: number;
  lesson: MicroLesson;
  reflectionPrompt: string;
}

export interface JourneyWeek {
  number: number;
  title: string;
  subtitle: string;
  days: [number, number];
}

export interface Journey {
  id: string;
  title: string;
  tagline: string;
  description: string;
  lengthDays: number;
  weeks: JourneyWeek[];
  days: JourneyDay[];
}

export interface Pathway {
  id: string;
  title: string;
  description: string;
  occasion: Occasion;
  dhikrIds: string[];
}

export type KnowledgeItemType = "dhikr" | "word" | "concept" | "verse" | "hadith" | "name";

export interface KnowledgeItemRef {
  id: string;
  type: KnowledgeItemType;
  label: string;
}
