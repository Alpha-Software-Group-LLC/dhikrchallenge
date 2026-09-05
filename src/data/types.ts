import type { KnowledgeRow } from "@/lib/spaced";
import type { ReminderWindow } from "@/lib/reminders";

export type AudioMode = "arabic" | "english" | "both" | "off";
export type Routine = "starting" | "occasionally" | "most-days" | "consistent";
export type Theme = "system" | "light" | "dark";

export interface Preferences {
  goals?: string[];
  routine?: Routine;
  /** Daily commitment in minutes. */
  duration?: number;
  audio?: AudioMode;
  theme?: Theme;
  reminderWindows?: ReminderWindow[];
  customReminderTime?: string;
  sound?: boolean;
  haptics?: boolean;
  keepAwake?: boolean;
  showTransliteration?: boolean;
  arabicSize?: number;
  freeSessionsInStats?: boolean;
  /** Post-journey daily rhythm. */
  pathwayId?: string;
  school?: string;
  /** legacy single reminder time */
  reminder?: string;
}

export const DEFAULT_PREFERENCES: Required<Pick<Preferences, "duration" | "audio" | "theme" | "reminderWindows" | "sound" | "haptics" | "keepAwake" | "showTransliteration" | "arabicSize" | "freeSessionsInStats">> = {
  duration: 3,
  audio: "arabic",
  theme: "system",
  reminderWindows: [],
  sound: false,
  haptics: true,
  keepAwake: true,
  showTransliteration: true,
  arabicSize: 40,
  freeSessionsInStats: true,
};

export interface CompletedDay {
  day: number;
  date: string;
  dhikrId: string;
}

export interface UserJourney {
  id: string;
  journeyId: string;
  startedOn: string;
  status: "active" | "completed" | "paused";
  completedOn: string | null;
  completedDays: CompletedDay[];
}

export interface JourneyHistoryEntry {
  journeyId: string;
  startedOn: string;
  status: string;
  completedOn: string | null;
  daysCompleted: number;
}

export interface CompletionRow {
  date: string;
  dhikrId: string;
}

export interface SessionRow {
  id: string;
  dhikrId: string;
  kind: "journey" | "daily" | "free";
  target: number;
  count: number;
  durationSeconds: number;
  date: string;
  includeInStats: boolean;
  note: string | null;
  createdAt: string;
}

export interface ReflectionRow {
  dhikrId: string;
  date: string;
  mood: string;
  note: string | null;
  createdAt: string;
}

export interface SavedItem {
  itemType: string;
  itemId: string;
}

export type Visibility = "private" | "completion" | "shared";
export type CircleRole = "owner" | "admin" | "member";

export interface CircleSummary {
  id: string;
  name: string;
  purpose: string | null;
  journeyId: string;
  ownerId: string;
  role: CircleRole;
  myVisibility: Visibility;
  inviteCode: string | null;
  memberCount: number;
  /** null when suppressed to protect a private member in a small circle */
  participatedToday: number | null;
  iCompletedToday: boolean;
}

export interface CircleMember {
  userId: string | null;
  name: string;
  role: CircleRole;
  isMe: boolean;
  visibility: Visibility | null;
  completedToday: boolean | null;
  journeyDay: number | null;
  encouragedByMeToday: boolean;
}

export type EncouragementKind = "dua" | "encourage" | "alhamdulillah" | "accept";

export interface CircleEvent {
  id: number;
  kind: "joined" | "left" | "completed_day" | "circle_completed" | "encouraged" | "learned" | "journey_completed" | "journey_started";
  actorName: string | null;
  actorIsMe: boolean;
  payload: Record<string, unknown>;
  date: string;
  createdAt: string;
}

export interface CircleHome {
  id: string;
  name: string;
  purpose: string | null;
  journeyId: string;
  ownerId: string;
  createdAt: string;
  role: CircleRole;
  myVisibility: Visibility;
  inviteCode: string | null;
  intention: string | null;
  memberCount: number;
  participatedToday: number | null;
  togetherDays: number;
  momentsTogether: number;
  members: CircleMember[];
  encouragementsForMe: { kind: EncouragementKind; fromName: string; date: string }[];
  events: CircleEvent[];
}

export interface InvitePreview {
  name: string;
  purpose: string | null;
  journeyId: string;
  memberCount: number;
  alreadyMember: boolean;
}

export interface HomeData {
  profile: { displayName: string | null };
  preferences: Preferences;
  onboardingCompleted: boolean;
  journey: UserJourney | null;
  journeyHistory: JourneyHistoryEntry[];
  completions: CompletionRow[];
  totalCompletionDays: number;
  firstCompletionDate: string | null;
  sessions: SessionRow[];
  knowledge: KnowledgeRow[];
  reflections: ReflectionRow[];
  savedItems: SavedItem[];
  circles: CircleSummary[];
}

export function emptyHome(): HomeData {
  return {
    profile: { displayName: null },
    preferences: {},
    onboardingCompleted: false,
    journey: null,
    journeyHistory: [],
    completions: [],
    totalCompletionDays: 0,
    firstCompletionDate: null,
    sessions: [],
    knowledge: [],
    reflections: [],
    savedItems: [],
    circles: [],
  };
}

export interface SessionResult {
  dhikrId: string;
  target: number;
  count: number;
  durationSeconds: number;
}
