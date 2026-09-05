import { useEffect, useState } from "react";
import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { Button, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import type { CircleSummary } from "@/data/types";
import { friendlyError } from "@/data/backend";
import { readJSON } from "@/lib/storage";

export function CirclesPage() {
  const { home, mode, backend, today, updateHome } = useStore();
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const pendingInvite = readJSON<string | null>("dhikr:pending-invite", null);

  const refresh = async () => {
    if (mode !== "account") return;
    setLoading(true);
    setError(null);
    try {
      const circles = await backend.listCircles(today);
      updateHome((h) => ({ ...h, circles }));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, today]);

  if (mode === "guest") {
    return (
      <div className="page">
        <header className="page-header anim-up">
          <div className="eyebrow">Circles</div>
          <h1>Remember together.</h1>
        </header>
        <EmptyState
          arabic="وَٱذْكُرُوا۟ ٱللَّهَ كَثِيرًا"
          title="Circles need an account."
          body="A Circle is a small, private, invite-only group of people you trust, encouraging one another to remember Allah. Create a free account and the progress on this device comes with you."
          action={
            <div className="stack">
              <Button size="lg" onClick={() => navigate("/signup")}>
                Create a free account
              </Button>
              <Button variant="ghost" onClick={() => navigate("/signin")}>
                I already have one
              </Button>
            </div>
          }
        />
        <PrivacyPromise />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header anim-up">
        <div className="eyebrow">Circles</div>
        <h1>Remember together.</h1>
        <p>Small, private, invite-only. The group is what's shown, never a leaderboard.</p>
      </header>

      {pendingInvite && (
        <div className="card green anim-up" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600 }}>You have a pending invite.</div>
          <div style={{ marginTop: 10 }}>
            <Button size="sm" onClick={() => navigate(`/join/${pendingInvite}`)}>
              Open invite
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 14 }}>
          <ErrorState message={error} onRetry={() => void refresh()} />
        </div>
      )}

      {loading && home.circles.length === 0 ? (
        <Skeleton lines={3} height={60} />
      ) : home.circles.length === 0 ? (
        <EmptyState
          arabic="مَعًا"
          title="Remember Allah with the people you love."
          body="Create a private Circle for family or friends and encourage one another to stay consistent. No feeds, no followers, no scores."
          action={
            <Button size="lg" onClick={() => navigate("/circles/new")}>
              Create a Circle
            </Button>
          }
        />
      ) : (
        <div className="stack anim-up d1" role="list">
          {home.circles.map((c) => (
            <CircleCard key={c.id} circle={c} />
          ))}
        </div>
      )}

      <div className="grid-2 anim-up d2" style={{ marginTop: 16 }}>
        <Button variant="secondary" onClick={() => navigate("/circles/new")} block>
          Create a Circle
        </Button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
            if (clean.length >= 8) navigate(`/join/${clean}`);
          }}
          className="row"
          style={{ gap: 6 }}
        >
          <input className="input" style={{ minHeight: 48, textTransform: "uppercase", letterSpacing: "0.1em" }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Invite code" aria-label="Invite code" maxLength={32} />
          <Button type="submit" variant="quiet" disabled={code.replace(/[^A-Za-z0-9]/g, "").length < 8}>
            Join
          </Button>
        </form>
      </div>

      <PrivacyPromise />
    </div>
  );
}

function CircleCard({ circle }: { circle: CircleSummary }) {
  return (
    <Link to={`/circles/${circle.id}`} role="listitem" className="card clickable" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="card-title" style={{ fontSize: 20 }}>
            {circle.name}
          </div>
          {circle.purpose && <div className="card-note">{circle.purpose}</div>}
        </div>
        <span className="pill muted">
          {circle.memberCount} {circle.memberCount === 1 ? "member" : "members"}
        </span>
      </div>
      <div className="row between" style={{ marginTop: 14 }}>
        <div className="small" style={{ color: "var(--text2)" }}>
          {circle.participatedToday === null ? "Remembering together today" : circle.participatedToday === 0 ? "No one has remembered yet today" : `${circle.participatedToday} of ${circle.memberCount} remembered Allah today`}
        </div>
        {circle.iCompletedToday ? <span className="pill">You · done</span> : <span className="pill gold">You · not yet</span>}
      </div>
      <div className="member-dots" style={{ marginTop: 10 }} aria-hidden="true">
        {Array.from({ length: Math.min(circle.memberCount, 16) }).map((_, i) => (
          <i key={i} className={circle.participatedToday !== null && i < circle.participatedToday ? "on" : ""} />
        ))}
      </div>
    </Link>
  );
}

export function PrivacyPromise() {
  return (
    <div className="card quiet" style={{ marginTop: 18 }}>
      <div className="eyebrow">Privacy is an amanah</div>
      <ul className="small" style={{ color: "var(--text2)", paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Circles never see your counts, free sessions, reflections or knowledge.</li>
        <li>You choose what each Circle sees: nothing, whether you completed today, or your journey day.</li>
        <li>No public profiles, no followers, no leaderboards, no likes.</li>
        <li>Enforced in the database, not only in the interface.</li>
      </ul>
    </div>
  );
}
