import type { ReactNode } from "react";
import { Link, useRouter } from "./router";
import { useStore } from "@/data/store";
import { IconCircles, IconDhikr, IconJourney, IconToday, IconYou } from "./ui";

const NAV = [
  { to: "/", label: "Today", icon: IconToday, match: (p: string) => p === "/" },
  { to: "/journey", label: "Journey", icon: IconJourney, match: (p: string) => p.startsWith("/journey") },
  { to: "/dhikr", label: "Dhikr", icon: IconDhikr, match: (p: string) => p.startsWith("/dhikr") || p.startsWith("/tasbih") },
  { to: "/circles", label: "Circles", icon: IconCircles, match: (p: string) => p.startsWith("/circles") || p.startsWith("/join") },
  { to: "/you", label: "You", icon: IconYou, match: (p: string) => p.startsWith("/you") },
];

export function BottomNav() {
  const { path } = useRouter();
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="inner">
        {NAV.map((n) => {
          const active = n.match(path);
          const Icon = n.icon;
          return (
            <Link key={n.to} to={n.to} className={`nav-item ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
              <Icon />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} role={t.kind === "error" ? "alert" : "status"}>
          <span>{t.message}</span>
          <button type="button" className="btn ghost sm" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function OfflineBanner() {
  const { online, pendingCount } = useStore();
  if (online && !pendingCount) return null;
  return (
    <div role="status" className="small" style={{ textAlign: "center", padding: "8px 12px", background: "var(--gold-dim)", color: "var(--gold2)", borderBottom: "1px solid var(--gold-mid)" }}>
      {!online ? "You're offline. Sessions are saved on this device and will sync when you reconnect." : `${pendingCount} saved ${pendingCount === 1 ? "session is" : "sessions are"} waiting to sync.`}
    </div>
  );
}

export function AppShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="app-shell">
      <OfflineBanner />
      {children}
      {nav && <BottomNav />}
      <Toasts />
    </div>
  );
}

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="Dhikr Challenge home">
      <span className="mark" aria-hidden="true">
        ✦
      </span>
      Dhikr Challenge
    </Link>
  );
}
