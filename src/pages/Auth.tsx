import { useState } from "react";
import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { Arabic, Button, IconBack } from "@/components/ui";
import { friendlyError } from "@/data/backend";
import { readJSON, removeKey } from "@/lib/storage";

export function AuthPage({ mode: initial }: { mode: "signin" | "signup" }) {
  const { signIn, signUp, mode: appMode, accountsAvailable } = useStore();
  const { navigate } = useRouter();
  const [mode, setMode] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pendingInvite = readJSON<string | null>("dhikr:pending-invite", null);

  const afterAuth = () => {
    if (pendingInvite) {
      removeKey("dhikr:pending-invite");
      navigate(`/join/${pendingInvite}`);
    } else navigate("/");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNote(null);
    const em = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Your password needs at least 8 characters.");
    if (mode === "signup" && name.trim().length < 1) return setError("Please tell us your name so your Circle knows who you are.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const r = await signUp(name.trim(), em, password);
        if (r === "confirm-email") {
          setNote("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
      } else await signIn(em, password);
      afterAuth();
    } catch (err) {
      setError(friendlyError(err, "We couldn't sign you in. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (!accountsAvailable) {
    return (
      <div className="page page-public">
        <Link to="/" className="back-link">
          <IconBack /> Back
        </Link>
        <div className="card quiet" style={{ marginTop: 20 }}>
          <div className="card-title">Accounts aren't available here yet.</div>
          <div className="card-note">You can still practise as a guest on this device.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-public" style={{ maxWidth: 440 }}>
      <Link to={appMode === "signed-out" ? "/" : "/you"} className="back-link">
        <IconBack /> Back
      </Link>
      <div style={{ textAlign: "center", margin: "18px 0 22px" }} className="anim-up">
        <Arabic text="بِسْمِ ٱللَّهِ" size={26} color="var(--gold)" />
        <h1 className="serif" style={{ fontWeight: 500, fontSize: 32, marginTop: 8 }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="small" style={{ color: "var(--text2)", marginTop: 6 }}>
          {mode === "signup" ? "Keep your journey across devices and remember together in Circles." : "Sign in to continue your remembrance."}
        </p>
        {appMode === "guest" && mode === "signup" && <p className="form-note">The progress on this device will be added to your new account.</p>}
        {pendingInvite && <p className="form-note">After this step you'll be taken to your Circle invitation.</p>}
      </div>

      <div className="row anim-up d1" style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, padding: 4, marginBottom: 6 }} role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className="btn sm" style={{ flex: 1, background: mode === m ? "var(--gold)" : "transparent", color: mode === m ? "var(--on-gold)" : "var(--text2)" }} onClick={() => { setMode(m); setError(null); }}>
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="anim-up d2" noValidate>
        {mode === "signup" && (
          <label className="field">
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="How your Circle will see you" maxLength={60} />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" />
        </label>
        <label className="field">
          <span>Password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters" />
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        {note && (
          <div className="form-note" role="status">
            {note}
          </div>
        )}
        <div style={{ marginTop: 18 }}>
          <Button type="submit" size="lg" block loading={busy}>
            {mode === "signup" ? "Begin" : "Sign in"}
          </Button>
        </div>
      </form>
      <p className="small muted" style={{ textAlign: "center", marginTop: 22, lineHeight: 1.7 }}>
        Minimal information, private by default. No ads, no tracking of your worship, no selling of data. You can export or delete everything at any time.
      </p>
    </div>
  );
}
