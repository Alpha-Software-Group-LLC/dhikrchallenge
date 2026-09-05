import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { Button, ErrorState, IconBack, IconShare, Sheet, Skeleton } from "@/components/ui";
import type { CircleHome, CircleMember, EncouragementKind, Visibility } from "@/data/types";
import { friendlyError } from "@/data/backend";
import { track } from "@/lib/analytics";
import { VISIBILITY_OPTIONS } from "./CircleNew";
import { formatDate } from "@/lib/dates";

const ENCOURAGEMENTS: { kind: EncouragementKind; label: string; arabic?: string }[] = [
  { kind: "dua", label: "Made du'a for you" },
  { kind: "encourage", label: "Keep going" },
  { kind: "alhamdulillah", label: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّهِ" },
  { kind: "accept", label: "May Allah accept it" },
];

const ENCOURAGEMENT_TEXT: Record<EncouragementKind, string> = {
  dua: "made du'a for you",
  encourage: "encouraged you to keep going",
  alhamdulillah: "said Alhamdulillah with you",
  accept: "prayed that Allah accepts it from you",
};

function eventText(e: CircleHome["events"][number]): string {
  const who = e.actorIsMe ? "You" : e.actorName ?? "A member";
  switch (e.kind) {
    case "joined":
      return `${who} joined the Circle.`;
    case "left":
      return "A member left the Circle.";
    case "completed_day": {
      const day = Number(e.payload.day ?? 0);
      return day > 0 ? `${who} completed Day ${day}.` : `${who} remembered Allah today.`;
    }
    case "circle_completed":
      return "Your Circle remembered together today. Everyone completed.";
    case "encouraged": {
      const kind = String(e.payload.kind ?? "encourage") as EncouragementKind;
      return e.payload.toUser ? `${who} ${ENCOURAGEMENT_TEXT[kind] ?? "encouraged"} a member.` : `${who} ${ENCOURAGEMENT_TEXT[kind] ?? "encouraged"} the Circle.`;
    }
    case "learned":
      return `${who} learned: ${String(e.payload.label ?? "a new meaning")}.`;
    case "journey_completed":
      return `${who} completed 30 Days to a Stronger Heart.`;
    case "journey_started":
      return `${who} began a new journey.`;
    default:
      return "";
  }
}

export function CircleHomePage({ id }: { id: string }) {
  const { backend, today, notify, mode, updateHome } = useStore();
  const { navigate } = useRouter();
  const [data, setData] = useState<CircleHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(() => new URLSearchParams(window.location.search).get("invite") === "1");
  const { search } = useRouter();
  useEffect(() => {
    if (new URLSearchParams(search).get("invite") === "1") setInviteOpen(true);
  }, [search]);
  const [encourageOpen, setEncourageOpen] = useState<CircleMember | "circle" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const home = await backend.circleHome(id, today);
      setData(home);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [backend, id, today]);

  useEffect(() => {
    if (mode !== "account") {
      navigate("/circles", { replace: true });
      return;
    }
    void load();
  }, [load, mode, navigate]);

  useEffect(() => {
    if (inviteOpen) window.history.replaceState({}, "", `/circles/${id}`);
  }, [inviteOpen, id]);

  const act = async (fn: () => Promise<void>, success?: string) => {
    setBusy(true);
    try {
      await fn();
      if (success) notify(success, "success");
      await load();
      const circles = await backend.listCircles(today);
      updateHome((h) => ({ ...h, circles }));
    } catch (e) {
      notify(friendlyError(e), "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="page">
        <Link to="/circles" className="back-link">
          <IconBack /> Circles
        </Link>
        <Skeleton lines={5} height={40} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="page">
        <Link to="/circles" className="back-link">
          <IconBack /> Circles
        </Link>
        <ErrorState message={error ?? "This Circle could not be opened."} onRetry={() => void load()} />
      </div>
    );
  }

  const isAdmin = data.role === "owner" || data.role === "admin";
  const me = data.members.find((m) => m.isMe);
  const notYet = data.members.filter((m) => m.completedToday === false && !m.isMe);
  const inviteLink = data.inviteCode ? `${window.location.origin}/join/${data.inviteCode}` : null;

  const share = async () => {
    if (!inviteLink) return;
    const text = `Join my private Dhikr Challenge Circle “${data.name}”. We remember Allah together, a few minutes a day.`;
    try {
      if (navigator.share) await navigator.share({ title: "Join my Circle", text, url: inviteLink });
      else {
        await navigator.clipboard.writeText(`${text}\n${inviteLink}`);
        notify("Invite copied.", "success");
      }
      track("circle_invite_created", {});
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="page">
      <div className="row between">
        <Link to="/circles" className="back-link">
          <IconBack /> Circles
        </Link>
        <button type="button" className="btn ghost sm" onClick={() => setSettingsOpen(true)}>
          Settings
        </button>
      </div>
      <header className="page-header anim-up">
        <div className="eyebrow">Circle</div>
        <h1>{data.name}</h1>
        {data.purpose && <p>{data.purpose}</p>}
      </header>

      {data.encouragementsForMe.length > 0 && (
        <div className="card green anim-up" style={{ marginBottom: 14 }}>
          <div className="eyebrow green">For you</div>
          {data.encouragementsForMe.slice(0, 3).map((e, i) => (
            <div key={i} className="small" style={{ color: "var(--text)", lineHeight: 1.7 }}>
              {e.fromName} {ENCOURAGEMENT_TEXT[e.kind]}.
            </div>
          ))}
        </div>
      )}

      <section className="card raised gold anim-up d1" style={{ marginBottom: 14 }}>
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="eyebrow">Today</div>
            <div className="card-title">{data.participatedToday === null ? "Remembering together" : `${data.participatedToday} of ${data.memberCount} remembered Allah`}</div>
            {data.participatedToday === null && <div className="card-note">Exact counts are hidden in small Circles to protect a private member.</div>}
          </div>
        </div>
        <div className="member-dots" style={{ marginTop: 12 }} aria-hidden="true">
          {Array.from({ length: Math.min(data.memberCount, 24) }).map((_, i) => (
            <i key={i} className={data.participatedToday !== null && i < data.participatedToday ? "on" : ""} />
          ))}
        </div>
        {data.intention && (
          <p className="serif" style={{ fontStyle: "italic", fontSize: 17, color: "var(--text2)", marginTop: 14 }}>
            “{data.intention}”
          </p>
        )}
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div className="stat">
            <b>{data.togetherDays}</b>
            <span>days together in the last 30</span>
          </div>
          <div className="stat">
            <b>{data.momentsTogether.toLocaleString()}</b>
            <span>moments of remembrance together</span>
          </div>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          A day counts as “together” when at least half the Circle completed. These are app activity, not reward; reward is with Allah.
        </p>
        <div className="grid-2" style={{ marginTop: 14 }}>
          <Button onClick={() => navigate(me?.completedToday ? "/dhikr" : "/")}>{me?.completedToday ? "More dhikr" : "Continue our dhikr"}</Button>
          <Button variant="secondary" onClick={() => setEncourageOpen("circle")}>
            Encourage Circle
          </Button>
        </div>
      </section>

      <section className="card anim-up d2" style={{ marginBottom: 14 }} aria-labelledby="members">
        <div className="row between">
          <div id="members" className="eyebrow" style={{ marginBottom: 0 }}>
            Members · {data.memberCount}
          </div>
          {isAdmin && (
            <button type="button" className="btn ghost sm" onClick={() => setInviteOpen(true)}>
              <IconShare /> Invite
            </button>
          )}
        </div>
        <div style={{ marginTop: 6 }}>
          {data.members.map((m, i) => (
            <div key={`${m.userId ?? "anon"}-${i}`} className="list-row">
              <div className={`avatar ${m.completedToday ? "done" : ""} ${m.completedToday === null ? "private" : ""}`} aria-hidden="true">
                {m.completedToday ? "✓" : m.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: m.isMe ? 600 : 500 }}>
                  {m.name}
                  {m.isMe ? " · you" : ""}
                  {m.role !== "member" && (
                    <span className="pill muted" style={{ marginLeft: 8 }}>
                      {m.role}
                    </span>
                  )}
                </div>
                <div className="small muted">
                  {m.completedToday === null ? "Keeps activity private" : m.completedToday ? "Remembered Allah today" : "Not yet today"}
                  {m.journeyDay ? ` · Day ${m.journeyDay}` : ""}
                </div>
              </div>
              {!m.isMe && m.userId && (
                <button type="button" className={`chip ${m.encouragedByMeToday ? "active" : ""}`} onClick={() => setEncourageOpen(m)} disabled={m.encouragedByMeToday} aria-label={`Encourage ${m.name}`}>
                  {m.encouragedByMeToday ? "Sent" : "Encourage"}
                </button>
              )}
            </div>
          ))}
        </div>
        {notYet.length > 0 && (
          <p className="small muted" style={{ marginTop: 8 }}>
            {notYet.length} {notYet.length === 1 ? "member" : "members"} could use encouragement today.
          </p>
        )}
      </section>

      <section className="card anim-up d3" aria-labelledby="activity">
        <div id="activity" className="eyebrow">
          Recently
        </div>
        {data.events.length === 0 ? (
          <p className="small muted">Quiet so far. The first completions will appear here.</p>
        ) : (
          <div>
            {data.events.slice(0, 8).map((e) => (
              <div key={e.id} className="event">
                <span style={{ flex: 1 }}>{eventText(e)}</span>
                <span className="when">{e.date === today ? "today" : formatDate(e.date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invite */}
      <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite">
        {data.inviteCode ? (
          <div className="stack">
            <p className="small" style={{ color: "var(--text2)", lineHeight: 1.6 }}>
              Share this link or code with people you trust. They'll see the Circle's name and size, nothing else, until they join.
            </p>
            <div className="invite-code" aria-label={`Invite code ${data.inviteCode}`}>
              {data.inviteCode}
            </div>
            <div className="grid-2">
              <Button onClick={share}>
                <IconShare /> Share link
              </Button>
              <Button
                variant="quiet"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteLink ?? data.inviteCode ?? "");
                  notify("Link copied.", "success");
                  track("circle_invite_created", {});
                }}
              >
                Copy link
              </Button>
            </div>
            <Button variant="ghost" size="sm" loading={busy} onClick={() => act(async () => { await backend.rotateInvite(id); }, "A new invite was created. The old link no longer works.")}>
              Revoke and create a new invite
            </Button>
          </div>
        ) : (
          <p className="small muted">Only the owner or an admin can invite.</p>
        )}
      </Sheet>

      {/* Encourage */}
      <Sheet open={Boolean(encourageOpen)} onClose={() => setEncourageOpen(null)} title={encourageOpen === "circle" ? "Encourage the Circle" : encourageOpen ? `Encourage ${encourageOpen.name}` : ""}>
        <p className="small" style={{ color: "var(--text2)", marginBottom: 14 }}>
          One quiet word, once a day. It pulls toward Allah, not toward the app.
        </p>
        <div className="encourage-row">
          {ENCOURAGEMENTS.map((e) => (
            <Button
              key={e.kind}
              variant="secondary"
              loading={busy}
              onClick={() =>
                act(async () => {
                  const to = encourageOpen && encourageOpen !== "circle" ? encourageOpen.userId : null;
                  await backend.sendEncouragement(id, e.kind, to, today);
                  track("encouragement_sent", { kind: e.kind, toCircle: to === null });
                  setEncourageOpen(null);
                }, "Sent.")
              }
            >
              {e.label}
            </Button>
          ))}
        </div>
      </Sheet>

      {/* Settings */}
      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Circle settings">
        <CircleSettings data={data} isAdmin={isAdmin} busy={busy} act={act} onLeft={() => navigate("/circles")} />
      </Sheet>
    </div>
  );
}

function CircleSettings({ data, isAdmin, busy, act, onLeft }: { data: CircleHome; isAdmin: boolean; busy: boolean; act: (fn: () => Promise<void>, ok?: string) => Promise<void>; onLeft: () => void }) {
  const { backend, today, notify } = useStore();
  const [name, setName] = useState(data.name);
  const [purpose, setPurpose] = useState(data.purpose ?? "");
  const [intention, setIntention] = useState(data.intention ?? "");
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);
  const [report, setReport] = useState("");
  const isOwner = data.role === "owner";
  const others = data.members.filter((m) => !m.isMe && m.userId);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <section>
        <div className="eyebrow">What this Circle sees about you</div>
        <div className="choice-list">
          {VISIBILITY_OPTIONS.map((o) => (
            <button key={o.id} type="button" className={`choice ${data.myVisibility === o.id ? "selected" : ""}`} disabled={busy} onClick={() => act(async () => backend.setMyVisibility(data.id, o.id as Visibility), "Visibility updated.")}>
              <span className="check" aria-hidden="true">
                {data.myVisibility === o.id ? "✓" : ""}
              </span>
              <span>
                {o.label}
                <small>{o.note}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section>
          <div className="eyebrow">Circle details</div>
          <label className="field" style={{ marginTop: 0 }}>
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </label>
          <label className="field">
            <span>Purpose</span>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={140} />
          </label>
          <label className="field">
            <span>Today's shared intention</span>
            <input value={intention} onChange={(e) => setIntention(e.target.value)} maxLength={280} placeholder="A small intention for the Circle today" />
          </label>
          <div style={{ marginTop: 12 }}>
            <Button
              size="sm"
              loading={busy}
              onClick={() =>
                act(async () => {
                  await backend.updateCircle(data.id, name.trim(), purpose.trim() || null);
                  if (intention.trim() && intention.trim() !== data.intention) await backend.setIntention(data.id, intention.trim(), today);
                }, "Saved.")
              }
            >
              Save details
            </Button>
          </div>
        </section>
      )}

      {isAdmin && others.length > 0 && (
        <section>
          <div className="eyebrow">Members</div>
          {others.map((m) => (
            <div key={m.userId} className="list-row">
              <div style={{ flex: 1 }}>
                <div>{m.name}</div>
                <div className="small muted">{m.role}</div>
              </div>
              {isOwner && m.role !== "owner" && (
                <button type="button" className="chip" disabled={busy} onClick={() => act(async () => backend.setMemberRole(data.id, m.userId!, m.role === "admin" ? "member" : "admin"), "Role updated.")}>
                  {m.role === "admin" ? "Make member" : "Make admin"}
                </button>
              )}
              {isOwner && (
                <button type="button" className="chip" disabled={busy} onClick={() => act(async () => backend.transferOwnership(data.id, m.userId!), "Ownership transferred.")}>
                  Make owner
                </button>
              )}
              {m.role !== "owner" && !(data.role === "admin" && m.role === "admin") && (
                <button type="button" className="chip" style={{ color: "var(--rose)" }} disabled={busy} onClick={() => act(async () => backend.removeMember(data.id, m.userId!), `${m.name} was removed.`)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      <section>
        <div className="eyebrow">Report a problem</div>
        <div className="row" style={{ gap: 6 }}>
          <input className="input" value={report} onChange={(e) => setReport(e.target.value)} placeholder="What's wrong? (name, purpose, behaviour)" maxLength={500} />
          <Button size="sm" variant="quiet" disabled={report.trim().length < 3 || busy} onClick={() => act(async () => { await backend.reportCircle(data.id, report.trim()); setReport(""); }, "Thank you. We'll look into it.")}>
            Send
          </Button>
        </div>
      </section>

      <section className="stack" style={{ gap: 8 }}>
        {!isOwner && (
          <Button variant="danger" block onClick={() => setConfirm("leave")}>
            Leave Circle
          </Button>
        )}
        {isOwner && (
          <Button variant="danger" block onClick={() => setConfirm("delete")}>
            Delete Circle
          </Button>
        )}
        {isOwner && others.length > 0 && <p className="small muted">To leave, first make someone else the owner.</p>}
      </section>

      <Sheet open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === "delete" ? "Delete this Circle?" : "Leave this Circle?"}>
        <p className="body-text" style={{ color: "var(--text2)" }}>
          {confirm === "delete" ? "Every member loses access and the Circle's activity is removed. Personal journeys are not affected." : "You can rejoin later with a new invite. Your personal journey is not affected."}
        </p>
        <div className="actions">
          <Button variant="quiet" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              try {
                if (confirm === "delete") await backend.deleteCircle(data.id);
                else await backend.leaveCircle(data.id);
                notify(confirm === "delete" ? "Circle deleted." : "You left the Circle.", "success");
                onLeft();
              } catch (e) {
                notify(friendlyError(e), "error");
              }
            }}
          >
            {confirm === "delete" ? "Delete" : "Leave"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
