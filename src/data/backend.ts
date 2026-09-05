import type { KnowledgeRow } from "@/lib/spaced";
import type {
  CircleHome,
  CircleSummary,
  EncouragementKind,
  HomeData,
  InvitePreview,
  Preferences,
  SessionResult,
  Visibility,
} from "./types";

export type BackendKind = "supabase" | "local";

/**
 * Everything the UI can do. Two implementations: Supabase (production, RLS
 * enforced) and Local (guest mode on this device). Circle methods throw
 * `NeedsAccountError` in guest mode.
 */
export interface Backend {
  readonly kind: BackendKind;
  loadHome(localDate: string): Promise<HomeData>;
  startJourney(journeyId: string, localDate: string): Promise<HomeData>;
  completeJourneyDay(day: number, localDate: string, result: SessionResult): Promise<HomeData>;
  completeDailyDhikr(localDate: string, result: SessionResult): Promise<HomeData>;
  saveFreeSession(localDate: string, result: SessionResult, includeInStats: boolean, note: string | null): Promise<void>;
  saveKnowledge(rows: (KnowledgeRow & { label?: string })[], localDate: string): Promise<void>;
  savePreferences(prefs: Preferences & { onboardingCompleted?: boolean }): Promise<void>;
  saveReflection(dhikrId: string, mood: string, note: string, localDate: string): Promise<void>;
  toggleSavedItem(type: string, id: string): Promise<boolean>;

  // Circles
  listCircles(localDate: string): Promise<CircleSummary[]>;
  circleHome(circleId: string, localDate: string): Promise<CircleHome>;
  createCircle(name: string, purpose: string | null): Promise<{ id: string }>;
  previewInvite(code: string): Promise<InvitePreview | null>;
  joinCircle(code: string, visibility: Visibility): Promise<{ id: string }>;
  rotateInvite(circleId: string): Promise<string>;
  updateCircle(circleId: string, name: string, purpose: string | null): Promise<void>;
  setMyVisibility(circleId: string, visibility: Visibility): Promise<void>;
  leaveCircle(circleId: string): Promise<void>;
  removeMember(circleId: string, userId: string): Promise<void>;
  setMemberRole(circleId: string, userId: string, role: "admin" | "member"): Promise<void>;
  transferOwnership(circleId: string, userId: string): Promise<void>;
  deleteCircle(circleId: string): Promise<void>;
  sendEncouragement(circleId: string, kind: EncouragementKind, toUserId: string | null, localDate: string): Promise<void>;
  setIntention(circleId: string, intention: string, localDate: string): Promise<void>;
  reportCircle(circleId: string, reason: string): Promise<void>;

  // Account
  exportData(): Promise<unknown>;
  deleteAccount(): Promise<void>;
}

export class NeedsAccountError extends Error {
  constructor(message = "Create a free account to use Circles.") {
    super(message);
    this.name = "NeedsAccountError";
  }
}

export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof NeedsAccountError) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const msg = String((error as { message: unknown }).message || "");
    if (/fetch|network|Failed to fetch|NetworkError/i.test(msg)) return "You seem to be offline. Your progress is safe; try again when you're connected.";
    if (msg) return msg.replace(/^[A-Z0-9]+:\s*/, "");
  }
  return fallback;
}
