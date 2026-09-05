import { useEffect, useState } from "react";
import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { Button, ErrorState, IconBack, Skeleton } from "@/components/ui";
import type { InvitePreview, Visibility } from "@/data/types";
import { friendlyError } from "@/data/backend";
import { getSupabase } from "@/data/supabaseClient";
import { VISIBILITY_OPTIONS } from "./CircleNew";
import { removeKey, writeJSON } from "@/lib/storage";
import { track } from "@/lib/analytics";
import { STRONGER_HEART } from "@/content";

export function JoinPage({ code }: { code: string }) {
  const { mode, backend, today, updateHome, notify, accountsAvailable } = useStore();
  const { navigate } = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("completion");
  const [busy, setBusy] = useState(false);
  const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!accountsAvailable) throw new Error("Accounts are not available right now.");
        let data: InvitePreview | null;
        if (mode === "account") data = await backend.previewInvite(clean);
        else {
          // Previews work signed-out: name and size only.
          const client = await getSupabase();
          const res = await client.rpc("preview_circle_invite", { p_invite_code: clean });
          if (res.error) throw new Error(res.error.message);
          data = (res.data as InvitePreview | null) ?? null;
        }
        if (alive) setPreview(data);
      } catch (e) {
        if (alive) setError(friendlyError(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [clean, accountsAvailable, mode, backend]);

  const join = async () => {
    setBusy(true);
    try {
      const { id } = await backend.joinCircle(clean, visibility);
      const circles = await backend.listCircles(today);
      updateHome((h) => ({ ...h, circles }));
      removeKey("dhikr:pending-invite");
      track("circle_joined", {});
      notify(`Welcome to ${preview?.name ?? "the Circle"}.`, "success");
      navigate(`/circles/${id}`);
    } catch (e) {
      notify(friendlyError(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const needAccount = mode !== "account";

  return (
    <div className="page">
      <Link to={mode === "signed-out" ? "/" : "/circles"} className="back-link">
        <IconBack /> {mode === "signed-out" ? "Home" : "Circles"}
      </Link>
      <header className="page-header anim-up">
        <div className="eyebrow">Invitation</div>
        <h1>{preview ? `Join ${preview.name}` : "You're invited"}</h1>
        <p>A private Circle of people remembering Allah together.</p>
      </header>

      {error && <ErrorState message={error} />}
      {preview === undefined && !error && <Skeleton lines={3} height={30} />}
      {preview === null && !error && (
        <div className="card quiet">
          <div className="card-title" style={{ fontSize: 20 }}>
            This invite isn't valid.
          </div>
          <div className="card-note">It may have been revoked. Ask for a fresh link.</div>
        </div>
      )}

      {preview && (
        <div className="stack anim-up d1">
          <div className="card raised gold">
            <div className="card-title">{preview.name}</div>
            {preview.purpose && <div className="card-note">{preview.purpose}</div>}
            <div className="row wrap" style={{ marginTop: 12 }}>
              <span className="pill muted">
                {preview.memberCount} {preview.memberCount === 1 ? "member" : "members"}
              </span>
              <span className="pill gold">{STRONGER_HEART.title}</span>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              Members' activity is private until you join. Even then, you only ever see whether someone completed today, never counts.
            </p>
          </div>

          {preview.alreadyMember ? (
            <Button size="lg" onClick={() => navigate("/circles")}>
              You're already a member · Open Circles
            </Button>
          ) : needAccount ? (
            <div className="card">
              <div className="card-title" style={{ fontSize: 20 }}>
                Create a free account to join.
              </div>
              <div className="card-note">Circles need an account so your Circle can trust who's in it. {mode === "guest" ? "The progress on this device comes with you." : ""}</div>
              <div className="stack" style={{ marginTop: 14 }}>
                <Button
                  size="lg"
                  onClick={() => {
                    writeJSON("dhikr:pending-invite", clean);
                    navigate("/signup");
                  }}
                >
                  Create account
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    writeJSON("dhikr:pending-invite", clean);
                    navigate("/signin");
                  }}
                >
                  I already have an account
                </Button>
              </div>
            </div>
          ) : (
            <>
              <fieldset className="card" style={{ border: "1px solid var(--border)" }}>
                <legend className="eyebrow" style={{ padding: "0 6px" }}>
                  What this Circle will see about you
                </legend>
                <div className="choice-list">
                  {VISIBILITY_OPTIONS.map((o) => (
                    <button key={o.id} type="button" className={`choice ${visibility === o.id ? "selected" : ""}`} onClick={() => setVisibility(o.id)} aria-pressed={visibility === o.id}>
                      <span className="check" aria-hidden="true">
                        {visibility === o.id ? "✓" : ""}
                      </span>
                      <span>
                        {o.label}
                        <small>{o.note}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <Button size="lg" block loading={busy} onClick={join}>
                Join {preview.name}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
