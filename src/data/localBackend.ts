import type { KnowledgeRow } from "@/lib/spaced";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";
import { getJourney } from "@/content/journey";
import { NeedsAccountError, type Backend } from "./backend";
import { emptyHome, type CircleHome, type CircleSummary, type CompletedDay, type EncouragementKind, type HomeData, type InvitePreview, type Preferences, type SessionResult, type Visibility } from "./types";

const KEY = "dhikr:guest:v2";

interface GuestState extends HomeData {
  version: 2;
}

function load(): GuestState {
  const s = readJSON<GuestState | null>(KEY, null);
  if (s && s.version === 2) return s;
  return { ...emptyHome(), version: 2 };
}

function persist(s: GuestState) {
  writeJSON(KEY, s);
}

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Guest mode. Everything stays on this device. The shape mirrors the server
 * payload so the UI never knows the difference. Circles need an account.
 */
export class LocalBackend implements Backend {
  readonly kind = "local" as const;
  private state: GuestState = load();

  private snapshot(): HomeData {
    const { version: _v, ...rest } = this.state;
    return JSON.parse(JSON.stringify(rest)) as HomeData;
  }

  hasData(): boolean {
    return this.state.journey !== null || this.state.sessions.length > 0;
  }

  /** Days completed in the guest journey, for a one-time import at sign-up. */
  exportJourneyForImport(): { journeyId: string; days: CompletedDay[] } | null {
    if (!this.state.journey || !this.state.journey.completedDays.length) return null;
    return { journeyId: this.state.journey.journeyId, days: this.state.journey.completedDays };
  }

  clear() {
    this.state = { ...emptyHome(), version: 2 };
    removeKey(KEY);
  }

  async loadHome(_localDate?: string): Promise<HomeData> {
    return this.snapshot();
  }

  async startJourney(journeyId: string, localDate: string) {
    getJourney(journeyId);
    if (!this.state.journey || this.state.journey.status !== "active") {
      this.state.journey = { id: uuid(), journeyId, startedOn: localDate, status: "active", completedOn: null, completedDays: [] };
      this.state.journeyHistory.unshift({ journeyId, startedOn: localDate, status: "active", completedOn: null, daysCompleted: 0 });
      persist(this.state);
    }
    return this.snapshot();
  }

  async completeJourneyDay(day: number, localDate: string, r: SessionResult) {
    const j = this.state.journey;
    if (!j || j.status !== "active") throw new Error("No active journey");
    const next = (j.completedDays.at(-1)?.day ?? 0) + 1;
    if (day < next) return this.snapshot();
    if (day !== next) throw new Error(`Day ${day} is not the next day of your journey`);
    if (j.completedDays.some((d) => d.date === localDate)) throw new Error(`Today's day is already complete. Day ${day} opens tomorrow.`);
    const journey = getJourney(j.journeyId);
    const def = journey.days.find((d) => d.day === day);
    if (!def) throw new Error("Unknown journey day");
    j.completedDays.push({ day, date: localDate, dhikrId: def.dhikrId });
    this.addCompletion(localDate, def.dhikrId);
    this.state.sessions.unshift({ id: uuid(), dhikrId: def.dhikrId, kind: "journey", target: def.target, count: r.count, durationSeconds: r.durationSeconds, date: localDate, includeInStats: true, note: null, createdAt: new Date().toISOString() });
    if (day >= journey.lengthDays) {
      j.status = "completed";
      j.completedOn = localDate;
    }
    const hist = this.state.journeyHistory.find((h) => h.startedOn === j.startedOn && h.journeyId === j.journeyId);
    if (hist) {
      hist.daysCompleted = j.completedDays.length;
      hist.status = j.status;
      hist.completedOn = j.completedOn;
    }
    persist(this.state);
    return this.snapshot();
  }

  private addCompletion(localDate: string, dhikrId: string) {
    if (!this.state.completions.some((c) => c.date === localDate && c.dhikrId === dhikrId)) {
      this.state.completions.push({ date: localDate, dhikrId });
      this.state.completions.sort((a, b) => a.date.localeCompare(b.date));
    }
    this.state.totalCompletionDays = new Set(this.state.completions.map((c) => c.date)).size;
    this.state.firstCompletionDate = this.state.completions[0]?.date ?? null;
  }

  async completeDailyDhikr(localDate: string, r: SessionResult) {
    this.addCompletion(localDate, r.dhikrId);
    this.state.sessions.unshift({ id: uuid(), dhikrId: r.dhikrId, kind: "daily", target: r.target, count: r.count, durationSeconds: r.durationSeconds, date: localDate, includeInStats: true, note: null, createdAt: new Date().toISOString() });
    persist(this.state);
    return this.snapshot();
  }

  async saveFreeSession(localDate: string, r: SessionResult, includeInStats: boolean, note: string | null) {
    this.state.sessions.unshift({ id: uuid(), dhikrId: r.dhikrId, kind: "free", target: r.target, count: r.count, durationSeconds: r.durationSeconds, date: localDate, includeInStats, note, createdAt: new Date().toISOString() });
    persist(this.state);
  }

  async saveKnowledge(rows: (KnowledgeRow & { label?: string })[]) {
    for (const row of rows) {
      const { label: _l, ...clean } = row;
      const idx = this.state.knowledge.findIndex((k) => k.itemId === clean.itemId);
      if (idx >= 0) this.state.knowledge[idx] = clean;
      else this.state.knowledge.push(clean);
    }
    persist(this.state);
  }

  async savePreferences(prefs: Preferences & { onboardingCompleted?: boolean }) {
    const { onboardingCompleted, ...rest } = prefs;
    this.state.preferences = rest;
    if (typeof onboardingCompleted === "boolean") this.state.onboardingCompleted = onboardingCompleted;
    persist(this.state);
  }

  async saveReflection(dhikrId: string, mood: string, note: string, localDate: string) {
    const idx = this.state.reflections.findIndex((r) => r.dhikrId === dhikrId && r.date === localDate);
    const row = { dhikrId, date: localDate, mood, note: note.trim() || null, createdAt: new Date().toISOString() };
    if (idx >= 0) this.state.reflections[idx] = row;
    else this.state.reflections.unshift(row);
    persist(this.state);
  }

  async toggleSavedItem(type: string, id: string) {
    const idx = this.state.savedItems.findIndex((s) => s.itemType === type && s.itemId === id);
    if (idx >= 0) {
      this.state.savedItems.splice(idx, 1);
      persist(this.state);
      return false;
    }
    this.state.savedItems.push({ itemType: type, itemId: id });
    persist(this.state);
    return true;
  }

  private needsAccount(): never {
    throw new NeedsAccountError();
  }
  async listCircles(_localDate: string): Promise<CircleSummary[]> {
    return [];
  }
  async circleHome(_circleId: string, _localDate: string): Promise<CircleHome> {
    return this.needsAccount();
  }
  async createCircle(_name: string, _purpose: string | null): Promise<{ id: string }> {
    return this.needsAccount();
  }
  async previewInvite(_code: string): Promise<InvitePreview | null> {
    return this.needsAccount();
  }
  async joinCircle(_code: string, _visibility: Visibility): Promise<{ id: string }> {
    return this.needsAccount();
  }
  async rotateInvite(_circleId: string): Promise<string> {
    return this.needsAccount();
  }
  async updateCircle(_circleId: string, _name: string, _purpose: string | null): Promise<void> {
    return this.needsAccount();
  }
  async setMyVisibility(_circleId: string, _visibility: Visibility): Promise<void> {
    return this.needsAccount();
  }
  async leaveCircle(_circleId: string): Promise<void> {
    return this.needsAccount();
  }
  async removeMember(_circleId: string, _userId: string): Promise<void> {
    return this.needsAccount();
  }
  async setMemberRole(_circleId: string, _userId: string, _role: "admin" | "member"): Promise<void> {
    return this.needsAccount();
  }
  async transferOwnership(_circleId: string, _userId: string): Promise<void> {
    return this.needsAccount();
  }
  async deleteCircle(_circleId: string): Promise<void> {
    return this.needsAccount();
  }
  async sendEncouragement(_circleId: string, _kind: EncouragementKind, _toUserId: string | null, _localDate: string): Promise<void> {
    return this.needsAccount();
  }
  async setIntention(_circleId: string, _intention: string, _localDate: string): Promise<void> {
    return this.needsAccount();
  }
  async reportCircle(_circleId: string, _reason: string): Promise<void> {
    return this.needsAccount();
  }
  async exportData() {
    return this.snapshot();
  }
  async deleteAccount() {
    this.clear();
  }
}
