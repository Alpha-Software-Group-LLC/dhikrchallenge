import { useEffect, useMemo, useState } from "react";
import { ADHKAR, ADHKAR_BY_ID, OCCASION_LABELS, OCCASION_ORDER, searchLibrary, type DhikrItem, type Occasion } from "@/content";
import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { DhikrDetail } from "@/components/DhikrDetail";
import { DhikrSession } from "@/components/DhikrSession";
import { Arabic, IconSearch, SourceChip, sourceLabel } from "@/components/ui";

export function LibraryPage({ initialId }: { initialId?: string }) {
  const { home, saveFreeSession, notify } = useStore();
  const { navigate } = useRouter();
  const [query, setQuery] = useState("");
  const [occasion, setOccasion] = useState<Occasion | "all" | "saved">("all");
  const [detail, setDetail] = useState<DhikrItem | null>(initialId ? ADHKAR_BY_ID[initialId] ?? null : null);
  const [session, setSession] = useState<{ dhikr: DhikrItem; target: number } | null>(null);

  useEffect(() => {
    if (initialId && ADHKAR_BY_ID[initialId]) setDetail(ADHKAR_BY_ID[initialId]!);
  }, [initialId]);

  const savedSet = useMemo(() => new Set(home.savedItems.filter((s) => s.itemType === "dhikr").map((s) => s.itemId)), [home.savedItems]);
  const search = useMemo(() => (query.trim() ? searchLibrary(query) : null), [query]);

  const list = useMemo(() => {
    if (search) return search.results.filter((r) => r.type === "dhikr").map((r) => r.item as DhikrItem);
    if (occasion === "saved") return ADHKAR.filter((d) => savedSet.has(d.id));
    if (occasion === "all") return ADHKAR;
    return ADHKAR.filter((d) => d.occasions.includes(occasion));
  }, [search, occasion, savedSet]);

  const others = search ? search.results.filter((r) => r.type !== "dhikr").slice(0, 6) : [];

  const openDetail = (d: DhikrItem) => {
    setDetail(d);
    window.history.replaceState({}, "", `/dhikr/${d.id}`);
  };
  const closeDetail = () => {
    setDetail(null);
    window.history.replaceState({}, "", "/dhikr");
  };

  return (
    <div className="page">
      <header className="page-header anim-up">
        <div className="eyebrow">Dhikr</div>
        <h1>The library</h1>
        <p>Authentic adhkar by the moments of your day, with meaning and source.</p>
      </header>

      <Link to="/tasbih" className="card clickable green anim-up d1" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "inherit", marginBottom: 14 }}>
        <Arabic text="سُبْحَانَ ٱللَّهِ" size={26} color="var(--green2)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Free tasbih</div>
          <div className="small muted">Any dhikr, any count. Private by default.</div>
        </div>
        <span aria-hidden="true" style={{ color: "var(--green2)" }}>
          ›
        </span>
      </Link>

      <label className="anim-up d1" style={{ position: "relative", display: "block", marginBottom: 12 }}>
        <span className="sr-only">Search the library</span>
        <span style={{ position: "absolute", left: 14, top: 14, color: "var(--text3)" }} aria-hidden="true">
          <IconSearch />
        </span>
        <input className="input" style={{ paddingLeft: 42 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search: anxiety, sleep, subhanallah, forgiveness…" type="search" autoComplete="off" />
      </label>

      {!search && (
        <div className="chip-row anim-up d2" role="tablist" aria-label="Browse by situation">
          <button type="button" role="tab" aria-selected={occasion === "all"} className={`chip ${occasion === "all" ? "active" : ""}`} onClick={() => setOccasion("all")}>
            All
          </button>
          <button type="button" role="tab" aria-selected={occasion === "saved"} className={`chip ${occasion === "saved" ? "active" : ""}`} onClick={() => setOccasion("saved")}>
            Saved · {savedSet.size}
          </button>
          {OCCASION_ORDER.map((o) => (
            <button key={o} type="button" role="tab" aria-selected={occasion === o} className={`chip ${occasion === o ? "active" : ""}`} onClick={() => setOccasion(o)}>
              {OCCASION_LABELS[o].label}
            </button>
          ))}
        </div>
      )}

      {search?.fiqh && (
        <div className="form-note anim-in" style={{ marginBottom: 12 }}>
          This library points to sources; it does not issue rulings. For a personal fiqh question, ask a qualified scholar.
        </div>
      )}

      {occasion !== "all" && occasion !== "saved" && !search && (
        <p className="small muted" style={{ margin: "6px 0 12px" }}>
          {OCCASION_LABELS[occasion].hint}
        </p>
      )}

      <div className="stack anim-up d2" role="list">
        {list.length === 0 && (
          <div className="card quiet" style={{ textAlign: "center" }}>
            <div className="card-title" style={{ fontSize: 18 }}>
              {occasion === "saved" && !search ? "Nothing saved yet" : "No match yet"}
            </div>
            <div className="card-note">{occasion === "saved" && !search ? "Save any dhikr from its page to find it here." : "Try a feeling (anxious, grateful), a moment (sleep, travel) or a phrase (subhanallah)."}</div>
          </div>
        )}
        {list.map((d) => (
          <button key={d.id} type="button" role="listitem" className="card clickable" style={{ textAlign: "left" }} onClick={() => openDetail(d)}>
            <div className="row between" style={{ alignItems: "flex-start", gap: 14 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{d.title}</div>
                <div className="small" style={{ color: "var(--text2)", marginTop: 2, lineHeight: 1.5 }}>
                  {d.translation}
                </div>
                <div className="row wrap" style={{ marginTop: 8, gap: 6 }}>
                  <span className="pill muted">{d.occasions.map((o) => OCCASION_LABELS[o].label).slice(0, 2).join(" · ")}</span>
                  <span className="pill gold" title={sourceLabel(d.source)}>
                    {d.source.type === "quran" ? "Qur'an" : d.source.collection.replace("Sahih ", "").replace("Sunan ", "").replace("Jami' ", "")}
                  </span>
                  {savedSet.has(d.id) && <span className="pill">Saved</span>}
                </div>
              </div>
              <Arabic text={d.arabic.length > 40 ? d.arabic.slice(0, 40) + "…" : d.arabic} size={22} color="var(--gold2)" align="right" className="" />
            </div>
          </button>
        ))}
      </div>

      {others.length > 0 && (
        <section style={{ marginTop: 22 }} aria-label="Related sources">
          <div className="eyebrow green">Also in the library</div>
          <div className="stack">
            {others.map((r) => (
              <div key={`${r.type}-${r.item.id}`} className="card">
                {r.type === "verse" && (
                  <>
                    <div className="small" style={{ color: "var(--green2)", fontWeight: 600 }}>
                      {r.item.reference}
                    </div>
                    <p className="body-text" style={{ fontSize: 14, marginTop: 4 }}>
                      {r.item.meaning}
                    </p>
                    <p className="small muted" style={{ marginTop: 6 }}>
                      Read the full passage in a trusted Qur'an edition.
                    </p>
                  </>
                )}
                {r.type === "hadith" && (
                  <>
                    <div className="row between">
                      <div style={{ fontWeight: 600 }}>{r.item.title}</div>
                      <SourceChip source={r.item.source} compact />
                    </div>
                    <p className="body-text" style={{ fontSize: 14, marginTop: 4 }}>
                      {r.item.text}
                    </p>
                    <p className="small muted" style={{ marginTop: 6 }}>
                      Paraphrase. Keep the collection and number with it.
                    </p>
                  </>
                )}
                {r.type === "name" && (
                  <div className="row" style={{ gap: 14 }}>
                    <Arabic text={r.item.arabic} size={26} color="var(--gold2)" />
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.item.transliteration}</div>
                      <div className="small" style={{ color: "var(--text2)" }}>
                        {r.item.meaning} · {r.item.source.collection} {r.item.source.reference}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="small muted" style={{ marginTop: 22, lineHeight: 1.6 }}>
        Every item shows its source path. In-app notes are study aids, not a translation of record, and never a fatwa.
      </p>

      <DhikrDetail
        dhikr={detail}
        onClose={closeDetail}
        onBegin={(d, target) => {
          setDetail(null);
          setSession({ dhikr: d, target });
        }}
      />
      {session && (
        <DhikrSession
          dhikr={session.dhikr}
          target={session.target}
          context={{ kind: "free", label: session.dhikr.title, contextKey: `library:${session.dhikr.id}` }}
          persist={async () => {}}
          free={{
            onSave: async (result, include, note) => {
              await saveFreeSession(result, include, note);
              notify("Session saved.", "success");
            },
          }}
          onFinished={() => {
            setSession(null);
            navigate("/dhikr");
          }}
          onExit={() => setSession(null)}
        />
      )}
    </div>
  );
}
