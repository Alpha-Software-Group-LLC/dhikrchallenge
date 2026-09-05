import { LocalBackend } from "./localBackend";
import type { CircleHome, CircleMember, CircleSummary, EncouragementKind, InvitePreview, Visibility, CircleEvent } from "./types";
import { readJSON, writeJSON } from "@/lib/storage";

/**
 * Test-only backend: guest storage plus an in-memory Circle model that mirrors
 * the SQL privacy rules. Compiled in only when VITE_MOCK_BACKEND=1 so the
 * production bundle never carries it. Used by the browser walkthroughs.
 */
interface MockMember {
  userId: string;
  name: string;
  role: "owner" | "admin" | "member";
  visibility: Visibility;
  completedDates: string[];
  journeyDay: number;
}
interface MockCircle {
  id: string;
  name: string;
  purpose: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  intention: string | null;
  members: MockMember[];
  events: CircleEvent[];
  encouragements: { from: string; to: string | null; kind: EncouragementKind; date: string }[];
}

const KEY = "dhikr:mock-circles";
export const MOCK_ME = "me";

export class MockBackend extends LocalBackend {
  private circles: MockCircle[] = readJSON<MockCircle[]>(KEY, []);
  private nextEvent = 1;

  private save() {
    writeJSON(KEY, this.circles);
  }
  private find(id: string) {
    const c = this.circles.find((x) => x.id === id);
    if (!c) throw new Error("You are not a member of this circle");
    if (!c.members.some((m) => m.userId === MOCK_ME)) throw new Error("You are not a member of this circle");
    return c;
  }
  private me(c: MockCircle) {
    return c.members.find((m) => m.userId === MOCK_ME)!;
  }
  private event(c: MockCircle, kind: CircleEvent["kind"], actor: MockMember | null, payload: Record<string, unknown>, date: string) {
    c.events.unshift({ id: this.nextEvent++, kind, actorName: actor?.name ?? null, actorIsMe: actor?.userId === MOCK_ME, payload, date, createdAt: new Date().toISOString() });
  }
  private summary(c: MockCircle, date: string): CircleSummary {
    const me = this.me(c);
    const done = c.members.filter((m) => m.completedDates.includes(date)).length;
    const hasPrivate = c.members.some((m) => m.visibility === "private");
    return {
      id: c.id,
      name: c.name,
      purpose: c.purpose,
      journeyId: "stronger-heart-30",
      ownerId: c.ownerId,
      role: me.role,
      myVisibility: me.visibility,
      inviteCode: me.role === "member" ? null : c.inviteCode,
      memberCount: c.members.length,
      participatedToday: hasPrivate && c.members.length < 4 ? null : done,
      iCompletedToday: me.completedDates.includes(date),
    };
  }

  /** Seed a realistic family circle for walkthroughs. */
  seedFamily(today: string) {
    if (this.circles.length) return;
    const c: MockCircle = {
      id: "family",
      name: "Qureshi Family",
      purpose: "Remember Allah together every day.",
      inviteCode: "FAM1LY22",
      ownerId: MOCK_ME,
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      intention: "Before the day begins, remember Who began it.",
      members: [
        { userId: MOCK_ME, name: "Bilal", role: "owner", visibility: "completion", completedDates: [], journeyDay: 0 },
        { userId: "u2", name: "Ahmed", role: "member", visibility: "completion", completedDates: [today], journeyDay: 12 },
        { userId: "u3", name: "Maryam", role: "admin", visibility: "shared", completedDates: [today], journeyDay: 9 },
        { userId: "u4", name: "Yusuf", role: "member", visibility: "private", completedDates: [], journeyDay: 3 },
        { userId: "u5", name: "Hana", role: "member", visibility: "completion", completedDates: [], journeyDay: 5 },
      ],
      events: [],
      encouragements: [{ from: "u3", to: MOCK_ME, kind: "dua", date: today }],
    };
    this.circles.push(c);
    this.event(c, "completed_day", c.members[1]!, { day: 12 }, today);
    this.event(c, "learned", c.members[2]!, { label: "Al-Wakil — the Trustee" }, today);
    this.event(c, "joined", c.members[4]!, {}, today);
    this.save();
  }

  override async completeJourneyDay(day: number, localDate: string, r: Parameters<LocalBackend["completeJourneyDay"]>[2]) {
    const home = await super.completeJourneyDay(day, localDate, r);
    for (const c of this.circles) {
      const me = c.members.find((m) => m.userId === MOCK_ME);
      if (!me) continue;
      if (!me.completedDates.includes(localDate)) me.completedDates.push(localDate);
      me.journeyDay = day;
      if (me.visibility !== "private") this.event(c, "completed_day", me, { day }, localDate);
      if (c.members.every((m) => m.completedDates.includes(localDate))) this.event(c, "circle_completed", null, { members: c.members.length }, localDate);
    }
    this.save();
    return { ...home, circles: await this.listCircles(localDate) };
  }

  override async loadHome(localDate: string) {
    const home = await super.loadHome();
    return { ...home, circles: await this.listCircles(localDate) };
  }
  override async listCircles(localDate: string): Promise<CircleSummary[]> {
    return this.circles.filter((c) => c.members.some((m) => m.userId === MOCK_ME)).map((c) => this.summary(c, localDate));
  }
  override async circleHome(id: string, date: string): Promise<CircleHome> {
    const c = this.find(id);
    const me = this.me(c);
    const s = this.summary(c, date);
    const isAdmin = me.role !== "member";
    const members: CircleMember[] = c.members.map((m) => ({
      userId: m.visibility === "private" && m.userId !== MOCK_ME ? null : m.userId,
      name: m.name,
      role: m.role,
      isMe: m.userId === MOCK_ME,
      visibility: m.userId === MOCK_ME || isAdmin ? m.visibility : null,
      completedToday: m.visibility === "private" && m.userId !== MOCK_ME ? null : m.completedDates.includes(date),
      journeyDay: m.visibility === "shared" || m.userId === MOCK_ME ? m.journeyDay : null,
      encouragedByMeToday: c.encouragements.some((e) => e.from === MOCK_ME && e.to === m.userId && e.date === date),
    }));
    return {
      id: c.id,
      name: c.name,
      purpose: c.purpose,
      journeyId: "stronger-heart-30",
      ownerId: c.ownerId,
      createdAt: c.createdAt,
      role: me.role,
      myVisibility: me.visibility,
      inviteCode: s.inviteCode,
      intention: c.intention,
      memberCount: c.members.length,
      participatedToday: s.participatedToday,
      togetherDays: 24,
      momentsTogether: c.members.reduce((a, m) => a + m.completedDates.length, 0) + 180,
      members,
      encouragementsForMe: c.encouragements.filter((e) => (e.to === MOCK_ME || e.to === null) && e.from !== MOCK_ME && e.date >= date).map((e) => ({ kind: e.kind, fromName: c.members.find((m) => m.userId === e.from)?.name ?? "A member", date: e.date })),
      events: c.events.slice(0, 10),
    };
  }
  override async createCircle(name: string, purpose: string | null) {
    const id = `c${Date.now()}`;
    const c: MockCircle = { id, name, purpose, inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, "X"), ownerId: MOCK_ME, createdAt: new Date().toISOString(), intention: null, members: [{ userId: MOCK_ME, name: "Bilal", role: "owner", visibility: "completion", completedDates: [], journeyDay: 0 }], events: [], encouragements: [] };
    this.circles.push(c);
    this.save();
    return { id };
  }
  override async previewInvite(code: string): Promise<InvitePreview | null> {
    const c = this.circles.find((x) => x.inviteCode === code.toUpperCase());
    if (!c) return null;
    return { name: c.name, purpose: c.purpose, journeyId: "stronger-heart-30", memberCount: c.members.length, alreadyMember: c.members.some((m) => m.userId === MOCK_ME) };
  }
  override async joinCircle(code: string, visibility: Visibility) {
    const c = this.circles.find((x) => x.inviteCode === code.toUpperCase());
    if (!c) throw new Error("That invite is not valid. Ask for a fresh link.");
    if (!c.members.some((m) => m.userId === MOCK_ME)) {
      c.members.push({ userId: MOCK_ME, name: "Bilal", role: "member", visibility, completedDates: [], journeyDay: 0 });
      this.event(c, "joined", this.me(c), {}, new Date().toISOString().slice(0, 10));
    }
    this.save();
    return { id: c.id };
  }
  override async rotateInvite(id: string) {
    const c = this.find(id);
    if (this.me(c).role === "member") throw new Error("Only the circle owner or an admin can change the invite");
    c.inviteCode = Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, "X");
    this.save();
    return c.inviteCode;
  }
  override async updateCircle(id: string, name: string, purpose: string | null) {
    const c = this.find(id);
    c.name = name;
    c.purpose = purpose;
    this.save();
  }
  override async setMyVisibility(id: string, visibility: Visibility) {
    this.me(this.find(id)).visibility = visibility;
    this.save();
  }
  override async leaveCircle(id: string) {
    const c = this.find(id);
    if (c.ownerId === MOCK_ME) throw new Error("Transfer ownership or delete the circle before leaving");
    c.members = c.members.filter((m) => m.userId !== MOCK_ME);
    this.save();
  }
  override async removeMember(id: string, userId: string) {
    const c = this.find(id);
    if (this.me(c).role === "member") throw new Error("Only the circle owner or an admin can remove members");
    c.members = c.members.filter((m) => m.userId !== userId);
    this.save();
  }
  override async setMemberRole(id: string, userId: string, role: "admin" | "member") {
    const c = this.find(id);
    const m = c.members.find((x) => x.userId === userId);
    if (m) m.role = role;
    this.save();
  }
  override async transferOwnership(id: string, userId: string) {
    const c = this.find(id);
    c.ownerId = userId;
    this.me(c).role = "admin";
    const m = c.members.find((x) => x.userId === userId);
    if (m) m.role = "owner";
    this.save();
  }
  override async deleteCircle(id: string) {
    const c = this.find(id);
    if (c.ownerId !== MOCK_ME) throw new Error("Only the circle owner can delete the circle");
    this.circles = this.circles.filter((x) => x.id !== id);
    this.save();
  }
  override async sendEncouragement(id: string, kind: EncouragementKind, to: string | null, date: string) {
    const c = this.find(id);
    if (to && !c.members.some((m) => m.userId === to)) throw new Error("That person is not a member of this circle");
    if (!c.encouragements.some((e) => e.from === MOCK_ME && e.to === to && e.kind === kind && e.date === date)) {
      c.encouragements.push({ from: MOCK_ME, to, kind, date });
      this.event(c, "encouraged", this.me(c), { kind, toUser: to }, date);
    }
    this.save();
  }
  override async setIntention(id: string, intention: string, _localDate: string) {
    this.find(id).intention = intention;
    this.save();
  }
  override async reportCircle(_id: string, _reason: string) {}
}
