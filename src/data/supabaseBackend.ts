import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeRow } from "@/lib/spaced";
import type { Backend } from "./backend";
import { emptyHome, type CompletedDay, type CircleHome, type CircleSummary, type EncouragementKind, type HomeData, type InvitePreview, type Preferences, type SessionResult, type Visibility } from "./types";

export class SupabaseBackend implements Backend {
  readonly kind = "supabase" as const;
  constructor(private readonly client: SupabaseClient) {}

  private async rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await this.client.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data as T;
  }

  private normalizeHome(raw: Partial<HomeData> | null): HomeData {
    const base = emptyHome();
    if (!raw) return base;
    return {
      ...base,
      ...raw,
      profile: raw.profile ?? base.profile,
      preferences: raw.preferences ?? {},
      journey: raw.journey ?? null,
      journeyHistory: raw.journeyHistory ?? [],
      completions: raw.completions ?? [],
      sessions: raw.sessions ?? [],
      knowledge: (raw.knowledge ?? []).map((k) => ({ ...k, lastReviewedAt: k.lastReviewedAt ?? null, nextReviewAt: k.nextReviewAt ?? null })),
      reflections: raw.reflections ?? [],
      savedItems: raw.savedItems ?? [],
      circles: raw.circles ?? [],
    };
  }

  loadHome(localDate: string) {
    return this.rpc<HomeData>("my_dhikr_home", { p_local_date: localDate }).then((h) => this.normalizeHome(h));
  }
  startJourney(journeyId: string, localDate: string) {
    return this.rpc<HomeData>("start_journey", { p_journey_id: journeyId, p_local_date: localDate }).then((h) => this.normalizeHome(h));
  }
  completeJourneyDay(day: number, localDate: string, r: SessionResult) {
    return this.rpc<HomeData>("complete_journey_day", { p_day: day, p_local_date: localDate, p_count: r.count, p_duration_seconds: r.durationSeconds }).then((h) => this.normalizeHome(h));
  }
  completeDailyDhikr(localDate: string, r: SessionResult) {
    return this.rpc<HomeData>("complete_daily_dhikr", { p_dhikr_id: r.dhikrId, p_local_date: localDate, p_count: r.count, p_duration_seconds: r.durationSeconds }).then((h) => this.normalizeHome(h));
  }
  async saveFreeSession(localDate: string, r: SessionResult, includeInStats: boolean, note: string | null) {
    await this.rpc("save_free_session", { p_dhikr_id: r.dhikrId, p_target: r.target, p_count: r.count, p_duration_seconds: r.durationSeconds, p_local_date: localDate, p_include_in_stats: includeInStats, p_note: note });
  }
  async saveKnowledge(rows: (KnowledgeRow & { label?: string })[], localDate: string) {
    if (!rows.length) return;
    await this.rpc("save_knowledge_progress", { p_items: rows, p_local_date: localDate });
  }
  async savePreferences(prefs: Preferences & { onboardingCompleted?: boolean }) {
    await this.rpc("save_dhikr_preferences", { p_preferences: prefs });
  }
  async saveReflection(dhikrId: string, mood: string, note: string, localDate: string) {
    await this.rpc("save_dhikr_reflection", { p_dhikr_id: dhikrId, p_mood: mood, p_note: note, p_local_date: localDate });
  }
  toggleSavedItem(type: string, id: string) {
    return this.rpc<boolean>("toggle_saved_item", { p_item_type: type, p_item_id: id });
  }
  /** One-time import of guest progress after sign-up. The server ignores it when a journey already exists. */
  importJourneyProgress(journeyId: string, days: CompletedDay[], localDate: string) {
    return this.rpc<HomeData>("import_journey_progress", { p_journey_id: journeyId, p_days: days.map((d) => ({ day: d.day, date: d.date })), p_local_date: localDate }).then((h) => this.normalizeHome(h));
  }

  listCircles(localDate: string) {
    return this.rpc<CircleSummary[] | null>("my_dhikr_circles", { p_local_date: localDate }).then((c) => c ?? []);
  }
  circleHome(circleId: string, localDate: string) {
    return this.rpc<CircleHome>("circle_home", { p_circle_id: circleId, p_local_date: localDate });
  }
  createCircle(name: string, purpose: string | null) {
    return this.rpc<{ id: string }>("create_dhikr_circle", { p_name: name, p_purpose: purpose });
  }
  previewInvite(code: string) {
    return this.rpc<InvitePreview | null>("preview_circle_invite", { p_invite_code: code });
  }
  joinCircle(code: string, visibility: Visibility) {
    return this.rpc<{ id: string }>("join_dhikr_circle", { p_invite_code: code, p_visibility: visibility });
  }
  rotateInvite(circleId: string) {
    return this.rpc<string>("rotate_circle_invite", { p_circle_id: circleId });
  }
  async updateCircle(circleId: string, name: string, purpose: string | null) {
    await this.rpc("update_dhikr_circle", { p_circle_id: circleId, p_name: name, p_purpose: purpose });
  }
  async setMyVisibility(circleId: string, visibility: Visibility) {
    await this.rpc("set_my_circle_visibility", { p_circle_id: circleId, p_visibility: visibility });
  }
  async leaveCircle(circleId: string) {
    await this.rpc("leave_dhikr_circle", { p_circle_id: circleId });
  }
  async removeMember(circleId: string, userId: string) {
    await this.rpc("remove_circle_member", { p_circle_id: circleId, p_user_id: userId });
  }
  async setMemberRole(circleId: string, userId: string, role: "admin" | "member") {
    await this.rpc("set_circle_member_role", { p_circle_id: circleId, p_user_id: userId, p_role: role });
  }
  async transferOwnership(circleId: string, userId: string) {
    await this.rpc("transfer_circle_ownership", { p_circle_id: circleId, p_user_id: userId });
  }
  async deleteCircle(circleId: string) {
    await this.rpc("delete_dhikr_circle", { p_circle_id: circleId });
  }
  async sendEncouragement(circleId: string, kind: EncouragementKind, toUserId: string | null, localDate: string) {
    await this.rpc("send_encouragement", { p_circle_id: circleId, p_kind: kind, p_to_user: toUserId, p_local_date: localDate });
  }
  async setIntention(circleId: string, intention: string, localDate: string) {
    await this.rpc("set_circle_intention", { p_circle_id: circleId, p_intention: intention, p_local_date: localDate });
  }
  async reportCircle(circleId: string, reason: string) {
    await this.rpc("report_circle", { p_circle_id: circleId, p_reason: reason });
  }
  exportData() {
    return this.rpc<unknown>("export_my_data");
  }
  async deleteAccount() {
    await this.rpc("delete_my_account");
    await this.client.auth.signOut();
  }
}
