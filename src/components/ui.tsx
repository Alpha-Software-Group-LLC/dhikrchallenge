import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { Source } from "@/content/types";

/* ---------------- Buttons ---------------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", block, loading, className = "", children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={`btn ${variant} ${size === "md" ? "" : size} ${block ? "block" : ""} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? "Please wait…" : children}
    </button>
  );
}

/* ---------------- Toggle ---------------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}

/* ---------------- Arabic ---------------- */
export function Arabic({ text, size = 34, color, className = "", align = "center" }: { text: string; size?: number; color?: string; className?: string; align?: "center" | "right" | "left" }) {
  return (
    <div lang="ar" className={`arabic ${className}`} style={{ fontSize: size, color, textAlign: align }}>
      {text}
    </div>
  );
}

/* ---------------- Source ---------------- */
export function sourceLabel(s: Source): string {
  if (s.type === "quran") return `Qur'an ${s.reference}`;
  return `${s.collection} ${s.reference}`;
}

export function SourceChip({ source, virtueSource, compact }: { source: Source; virtueSource?: Source; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`chip ${compact ? "sm" : ""}`} onClick={() => setOpen(true)} aria-haspopup="dialog" style={compact ? { minHeight: 30, fontSize: 12, padding: "4px 10px" } : undefined}>
        <IconBook /> {sourceLabel(source)}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Source">
        <SourceDetail source={source} />
        {virtueSource && (
          <>
            <div className="divider" />
            <div className="eyebrow">Virtue reported in</div>
            <SourceDetail source={virtueSource} />
          </>
        )}
        <p className="small muted" style={{ marginTop: 16, lineHeight: 1.6 }}>
          References point to the collection and number so you can read the full text in a trusted edition. In-app wording is a study aid, not a translation of record. For rulings, ask a qualified scholar.
        </p>
      </Sheet>
    </>
  );
}

function SourceDetail({ source }: { source: Source }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="card-title">{source.type === "quran" ? "The Qur'an" : source.collection}</div>
      <div style={{ fontSize: 15 }}>{source.type === "quran" ? `Surah ${source.reference.split(":")[0]}, ayah ${source.reference.split(":")[1] ?? ""}` : `Hadith ${source.reference}`}</div>
      {source.grade && (
        <div className="small">
          <span className="pill">Grade · {source.grade}</span>
        </div>
      )}
      {source.note && <p className="small muted" style={{ lineHeight: 1.6 }}>{source.note}</p>}
    </div>
  );
}

/* ---------------- Sheet ---------------- */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => ref.current?.querySelector<HTMLElement>("button, [href], input, textarea, select")?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label={title ?? "Dialog"} onClick={(e) => e.stopPropagation()} style={wide ? { maxWidth: 720 } : undefined}>
        <div className="sheet-handle" aria-hidden="true" />
        {title && (
          <div className="row between" style={{ marginBottom: 14 }}>
            <h2>{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <IconClose />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ---------------- Progress ring ---------------- */
export function ProgressRing({ size = 120, stroke = 6, progress, gold, children, label }: { size?: number; stroke?: number; progress: number; gold?: boolean; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(Math.max(progress, 0), 1);
  return (
    <div className="ring" style={{ width: size, height: size }} role={label ? "img" : undefined} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle className={`bar ${gold ? "gold" : ""}`} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
      </svg>
      <div className="center">{children}</div>
    </div>
  );
}

/* ---------------- States ---------------- */
export function EmptyState({ arabic, title, body, action }: { arabic?: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state card">
      {arabic && (
        <div lang="ar" className="arabic">
          {arabic}
        </div>
      )}
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry, title = "Something didn't load" }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="error-state" role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
      {onRetry && (
        <Button variant="quiet" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ lines = 3, height = 18 }: { lines?: number; height?: number }) {
  return (
    <div className="stack" aria-hidden="true" style={{ gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, width: `${100 - (i % 3) * 14}%` }} />
      ))}
    </div>
  );
}

/* ---------------- Icons (inline SVG, stroke-based) ---------------- */
const svgProps = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconToday = () => (
  <svg {...svgProps}>
    <path d="M12 3a9 9 0 1 0 9 9c0-.6-.06-1.2-.17-1.77A6.5 6.5 0 0 1 12.77 3.17 9 9 0 0 0 12 3z" />
    <path d="m17.5 4 .6 1.4L19.5 6l-1.4.6L17.5 8l-.6-1.4L15.5 6l1.4-.6z" />
  </svg>
);
export const IconJourney = () => (
  <svg {...svgProps}>
    <path d="M4 19c4-1 4-6 8-7s4-6 8-7" />
    <circle cx="4" cy="19" r="1.6" />
    <circle cx="20" cy="5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
  </svg>
);
export const IconDhikr = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="4.5" r="1.7" />
    <circle cx="17.5" cy="7.5" r="1.7" />
    <circle cx="19.5" cy="13" r="1.7" />
    <circle cx="17" cy="18.5" r="1.7" />
    <circle cx="7" cy="18.5" r="1.7" />
    <circle cx="4.5" cy="13" r="1.7" />
    <circle cx="6.5" cy="7.5" r="1.7" />
    <path d="M12 21v-1.5" />
  </svg>
);
export const IconCircles = () => (
  <svg {...svgProps}>
    <circle cx="9" cy="9" r="3.2" />
    <circle cx="16.5" cy="10.5" r="2.4" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M14.5 19a4.5 4.5 0 0 1 6-4.2" />
  </svg>
);
export const IconYou = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
export const IconBook = () => (
  <svg {...svgProps} width={16} height={16}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5V5.5" />
    <path d="M8 7h8M8 10.5h8" />
  </svg>
);
export const IconClose = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconBack = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconUndo = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h9a6 6 0 0 1 0 12h-2" />
  </svg>
);
export const IconPause = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M8 5v14M16 5v14" />
  </svg>
);
export const IconPlay = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M7 4v16l13-8z" />
  </svg>
);
export const IconSound = ({ off }: { off?: boolean }) => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M4 10v4h3l4 4V6L7 10z" />
    {off ? <path d="M16 9l4 6M20 9l-4 6" /> : <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" />}
  </svg>
);
export const IconVibrate = () => (
  <svg {...svgProps} width={18} height={18}>
    <rect x="8" y="3" width="8" height="18" rx="2" />
    <path d="M4 8v8M20 8v8" />
  </svg>
);
export const IconSun = () => (
  <svg {...svgProps} width={18} height={18}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const IconCheck = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="m5 12 4.5 4.5L19 7" />
  </svg>
);
export const IconInfo = () => (
  <svg {...svgProps} width={18} height={18}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10.5V16M12 8v.5" />
  </svg>
);
export const IconStar = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  </svg>
);
export const IconHeart = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" />
  </svg>
);
export const IconShare = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M5 13v6h14v-6" />
  </svg>
);
export const IconSearch = () => (
  <svg {...svgProps} width={18} height={18}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </svg>
);
