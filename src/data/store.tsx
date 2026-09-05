import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { localDateStr } from "@/lib/dates";
import { readJSON, writeJSON } from "@/lib/storage";
import { track } from "@/lib/analytics";
import { applyAnswer, encounter, type KnowledgeRow } from "@/lib/spaced";
import { scheduleLocalReminder } from "@/lib/reminders";
import { resolveKnowledgeItem } from "@/content/knowledge";
import { getJourney } from "@/content/journey";
import { friendlyError, type Backend } from "./backend";
import { LocalBackend } from "./localBackend";
import { SupabaseBackend } from "./supabaseBackend";
import { ConfigUnavailableError, getSupabase } from "./supabaseClient";
import { DEFAULT_PREFERENCES, emptyHome, type HomeData, type Preferences, type SessionResult } from "./types";

export type Mode = "booting" | "signed-out" | "guest" | "account" | "error";

export interface User {
  id: string;
  email: string | null;
  name: string;
}

type PendingOp =
  | { type: "journeyDay"; day: number; date: string; result: SessionResult }
  | { type: "daily"; date: string; result: SessionResult }
  | { type: "free"; date: string; result: SessionResult; includeInStats: boolean; note: string | null }
  | { type: "knowledge"; date: string; rows: (KnowledgeRow & { label?: string })[] };

interface Toast {
  id: number;
  message: string;
  kind: "info" | "error" | "success";
}

export interface Store {
  mode: Mode;
  accountsAvailable: boolean;
  user: User | null;
  home: HomeData;
  prefs: Preferences & typeof DEFAULT_PREFERENCES;
  loading: boolean;
  error: string | null;
  today: string;
  online: boolean;
  pendingCount: number;
  backend: Backend;
  toasts: Toast[];
  notify: (message: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: number) => void;
  reload: () => Promise<void>;
  beginAsGuest: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<"signed-in" | "confirm-email">;
  signOut: () => Promise<void>;
  startJourney: (journeyId: string) => Promise<void>;
  completeJourneyDay: (day: number, result: SessionResult) => Promise<void>;
  completeDaily: (result: SessionResult) => Promise<void>;
  saveFreeSession: (result: SessionResult, includeInStats: boolean, note: string | null) => Promise<void>;
  encounterKnowledge: (itemIds: string[]) => Promise<void>;
  answerKnowledge: (itemIds: string[], correct: boolean) => Promise<void>;
  savePreferences: (partial: Partial<Preferences> & { onboardingCompleted?: boolean }) => Promise<void>;
  saveReflection: (dhikrId: string, mood: string, note: string) => Promise<void>;
  toggleSaved: (type: string, id: string) => Promise<void>;
  updateHome: (updater: (h: HomeData) => HomeData) => void;
}

const StoreContext = createContext<Store | null>(null);

const localBackend = new LocalBackend();
const GUEST_FLAG = "dhikr:guest-mode";

function pendingKey(userId: string | null) {
  return `dhikr:pending:${userId ?? "guest"}`;
}

function isNetworkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /fetch|network|offline|Failed to fetch|Load failed|NetworkError|timeout/i.test(msg) || (typeof navigator !== "undefined" && !navigator.onLine);
}

function userFromSession(u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): User | null {
  if (!u) return null;
  const meta = (u.user_metadata?.display_name as string | undefined) ?? "";
  const name = (meta || u.email?.split("@")[0] || "Friend").trim();
  return { id: u.id, email: u.email ?? null, name };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("booting");
  const [accountsAvailable, setAccountsAvailable] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [home, setHome] = useState<HomeData>(emptyHome());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState(localDateStr());
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const backendRef = useRef<Backend>(localBackend);
  const toastId = useRef(1);

  const notify = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const readPending = useCallback((): PendingOp[] => readJSON<PendingOp[]>(pendingKey(user?.id ?? null), []), [user?.id]);
  const writePending = useCallback(
    (ops: PendingOp[]) => {
      writeJSON(pendingKey(user?.id ?? null), ops);
      setPendingCount(ops.length);
    },
    [user?.id],
  );

  const loadHome = useCallback(
    async (backend: Backend, date: string) => {
      setLoading(true);
      try {
        const data = await backend.loadHome(date);
        setHome(data);
        setError(null);
      } catch (e) {
        setError(friendlyError(e, "Your progress could not be loaded. Your account is safe; try again."));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /** Replay queued writes. Silent on success; stays queued on network failure. */
  const flushPending = useCallback(async () => {
    const ops = readPending();
    if (!ops.length || !navigator.onLine) return;
    const remaining: PendingOp[] = [];
    let latest: HomeData | null = null;
    for (const op of ops) {
      try {
        const b = backendRef.current;
        if (op.type === "journeyDay") latest = await b.completeJourneyDay(op.day, op.date, op.result);
        else if (op.type === "daily") latest = await b.completeDailyDhikr(op.date, op.result);
        else if (op.type === "free") await b.saveFreeSession(op.date, op.result, op.includeInStats, op.note);
        else if (op.type === "knowledge") await b.saveKnowledge(op.rows, op.date);
      } catch (e) {
        if (isNetworkError(e)) remaining.push(op);
        // non-network errors (e.g. already completed) are dropped: the server state wins
      }
    }
    writePending(remaining);
    if (latest) setHome(latest);
    else if (ops.length !== remaining.length) await loadHome(backendRef.current, localDateStr());
    if (ops.length && !remaining.length) notify("Your saved sessions have synced.", "success");
  }, [readPending, writePending, loadHome, notify]);

  // Boot: decide between account, guest and signed-out.
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      // Browser walkthroughs: an in-memory account with a seeded Circle. Compiled out of production builds.
      if (import.meta.env.VITE_MOCK_BACKEND === "1" && readJSON<boolean>("dhikr:mock", false)) {
        const { MockBackend } = await import("./mockBackend");
        const mock = new MockBackend();
        mock.seedFamily(localDateStr());
        backendRef.current = mock;
        setUser({ id: "me", email: "bilal@example.com", name: "Bilal" });
        setMode("account");
        await loadHome(mock, localDateStr());
        return;
      }
      try {
        const client = await getSupabase();
        const { data } = await client.auth.getSession();
        if (cancelled) return;
        const u = userFromSession(data.session?.user ?? null);
        if (u) {
          backendRef.current = new SupabaseBackend(client);
          setUser(u);
          setMode("account");
          await loadHome(backendRef.current, localDateStr());
        } else if (readJSON<boolean>(GUEST_FLAG, false)) {
          backendRef.current = localBackend;
          setMode("guest");
          await loadHome(localBackend, localDateStr());
        } else {
          setMode("signed-out");
          setLoading(false);
        }
        unsubscribe = client.auth.onAuthStateChange((_event, session) => {
          const next = userFromSession(session?.user ?? null);
          setUser((prev) => {
            if (next && prev?.id !== next.id) {
              backendRef.current = new SupabaseBackend(client);
              setMode("account");
              void loadHome(backendRef.current, localDateStr());
            }
            if (!next && prev) {
              backendRef.current = localBackend;
              setHome(emptyHome());
              setMode("signed-out");
            }
            return next;
          });
        }).data.subscription.unsubscribe;
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ConfigUnavailableError) {
          setAccountsAvailable(false);
          backendRef.current = localBackend;
          if (readJSON<boolean>(GUEST_FLAG, false)) {
            setMode("guest");
            await loadHome(localBackend, localDateStr());
          } else {
            setMode("signed-out");
            setLoading(false);
          }
        } else {
          setError(friendlyError(e));
          setMode("error");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [loadHome]);

  // Online/offline and pending queue
  useEffect(() => {
    const on = () => {
      setOnline(true);
      void flushPending();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [flushPending]);
  useEffect(() => {
    if (mode === "account" || mode === "guest") {
      setPendingCount(readPending().length);
      void flushPending();
    }
  }, [mode, readPending, flushPending]);

  // Midnight rollover
  useEffect(() => {
    const id = window.setInterval(() => {
      const d = localDateStr();
      if (d !== today) {
        setToday(d);
        if (mode === "account" || mode === "guest") void loadHome(backendRef.current, d);
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [today, mode, loadHome]);

  const prefs = useMemo(() => ({ ...DEFAULT_PREFERENCES, ...home.preferences }), [home.preferences]);

  // Theme
  useEffect(() => {
    const t = prefs.theme;
    writeJSON("dhikr:theme", t);
    const apply = () => {
      const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [prefs.theme]);

  // Reminders while the app is open
  useEffect(() => {
    if (!prefs.reminderWindows.length) return;
    return scheduleLocalReminder(prefs.reminderWindows, prefs.customReminderTime);
  }, [prefs.reminderWindows, prefs.customReminderTime]);

  const reload = useCallback(() => loadHome(backendRef.current, localDateStr()), [loadHome]);

  const beginAsGuest = useCallback(() => {
    writeJSON(GUEST_FLAG, true);
    backendRef.current = localBackend;
    setMode("guest");
    void loadHome(localBackend, localDateStr());
  }, [loadHome]);

  const importGuestIfAny = useCallback(async (backend: SupabaseBackend) => {
    const guest = localBackend.exportJourneyForImport();
    const guestHome = await localBackend.loadHome();
    try {
      if (guest) await backend.importJourneyProgress(guest.journeyId, guest.days, localDateStr());
      if (Object.keys(guestHome.preferences).length || guestHome.onboardingCompleted) {
        await backend.savePreferences({ ...guestHome.preferences, onboardingCompleted: guestHome.onboardingCompleted });
      }
      if (guestHome.knowledge.length) await backend.saveKnowledge(guestHome.knowledge, localDateStr());
      localBackend.clear();
      writeJSON(GUEST_FLAG, false);
    } catch {
      /* the guest copy is kept; it will be offered again next sign-in */
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = await getSupabase();
      const { data, error: err } = await client.auth.signInWithPassword({ email, password });
      if (err) throw new Error(err.message);
      const u = userFromSession(data.user);
      if (!u) throw new Error("Sign-in failed");
      await client.from("dhikr_profiles").upsert({ user_id: u.id, display_name: u.name });
      const backend = new SupabaseBackend(client);
      backendRef.current = backend;
      await importGuestIfAny(backend);
      setUser(u);
      setMode("account");
      await loadHome(backend, localDateStr());
    },
    [importGuestIfAny, loadHome],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const client = await getSupabase();
      const { data, error: err } = await client.auth.signUp({ email, password, options: { data: { display_name: name } } });
      if (err) throw new Error(err.message);
      if (!data.session) return "confirm-email" as const;
      const u = userFromSession(data.user);
      if (!u) throw new Error("Sign-up failed");
      await client.from("dhikr_profiles").upsert({ user_id: u.id, display_name: name });
      const backend = new SupabaseBackend(client);
      backendRef.current = backend;
      await importGuestIfAny(backend);
      setUser(u);
      setMode("account");
      await loadHome(backend, localDateStr());
      return "signed-in" as const;
    },
    [importGuestIfAny, loadHome],
  );

  const signOut = useCallback(async () => {
    try {
      const client = await getSupabase();
      await client.auth.signOut();
    } catch {
      /* ignore */
    }
    writeJSON(GUEST_FLAG, false);
    backendRef.current = localBackend;
    setUser(null);
    setHome(emptyHome());
    setMode("signed-out");
  }, []);

  const updateHome = useCallback((updater: (h: HomeData) => HomeData) => setHome((h) => updater(h)), []);

  const startJourney = useCallback(
    async (journeyId: string) => {
      const next = await backendRef.current.startJourney(journeyId, localDateStr());
      setHome(next);
      track("journey_started", { journeyId });
    },
    [],
  );

  /** Optimistic + queued completion so a dropped connection never loses a session. */
  const completeJourneyDay = useCallback(
    async (day: number, result: SessionResult) => {
      const date = localDateStr();
      try {
        const next = await backendRef.current.completeJourneyDay(day, date, result);
        setHome(next);
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        writePending([...readPending(), { type: "journeyDay", day, date, result }]);
        setHome((h) => {
          if (!h.journey) return h;
          const journey = getJourney(h.journey.journeyId);
          const completedDays = [...h.journey.completedDays, { day, date, dhikrId: result.dhikrId }];
          const status = day >= journey.lengthDays ? ("completed" as const) : h.journey.status;
          return {
            ...h,
            journey: { ...h.journey, completedDays, status, completedOn: status === "completed" ? date : h.journey.completedOn },
            completions: [...h.completions, { date, dhikrId: result.dhikrId }],
            totalCompletionDays: new Set([...h.completions.map((c) => c.date), date]).size,
          };
        });
        notify("Saved on this device. It will sync when you're back online.");
      }
      track("dhikr_session_completed", { kind: "journey", day, count: result.count });
    },
    [readPending, writePending, notify],
  );

  const completeDaily = useCallback(
    async (result: SessionResult) => {
      const date = localDateStr();
      try {
        const next = await backendRef.current.completeDailyDhikr(date, result);
        setHome(next);
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        writePending([...readPending(), { type: "daily", date, result }]);
        setHome((h) => ({ ...h, completions: [...h.completions, { date, dhikrId: result.dhikrId }], totalCompletionDays: new Set([...h.completions.map((c) => c.date), date]).size }));
        notify("Saved on this device. It will sync when you're back online.");
      }
      track("dhikr_session_completed", { kind: "daily", count: result.count });
    },
    [readPending, writePending, notify],
  );

  const saveFreeSession = useCallback(
    async (result: SessionResult, includeInStats: boolean, note: string | null) => {
      const date = localDateStr();
      const optimistic = { id: `local-${Date.now()}`, dhikrId: result.dhikrId, kind: "free" as const, target: result.target, count: result.count, durationSeconds: result.durationSeconds, date, includeInStats, note, createdAt: new Date().toISOString() };
      setHome((h) => ({ ...h, sessions: [optimistic, ...h.sessions] }));
      try {
        await backendRef.current.saveFreeSession(date, result, includeInStats, note);
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        writePending([...readPending(), { type: "free", date, result, includeInStats, note }]);
      }
      track("free_session_completed", { count: result.count });
    },
    [readPending, writePending],
  );

  const persistKnowledge = useCallback(
    async (rows: (KnowledgeRow & { label?: string })[]) => {
      setHome((h) => {
        const map = new Map(h.knowledge.map((k) => [k.itemId, k]));
        for (const r of rows) {
          const { label: _l, ...clean } = r;
          map.set(clean.itemId, clean);
        }
        return { ...h, knowledge: [...map.values()] };
      });
      const date = localDateStr();
      try {
        await backendRef.current.saveKnowledge(rows, date);
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        writePending([...readPending(), { type: "knowledge", date, rows }]);
      }
    },
    [readPending, writePending],
  );

  const encounterKnowledge = useCallback(
    async (itemIds: string[]) => {
      const now = new Date();
      const existing = new Map(home.knowledge.map((k) => [k.itemId, k]));
      const rows = itemIds.filter((id) => !existing.has(id) && resolveKnowledgeItem(id)).map((id) => encounter(undefined, id, now));
      if (rows.length) await persistKnowledge(rows);
    },
    [home.knowledge, persistKnowledge],
  );

  const answerKnowledge = useCallback(
    async (itemIds: string[], correct: boolean) => {
      const now = new Date();
      const existing = new Map(home.knowledge.map((k) => [k.itemId, k]));
      const rows = itemIds
        .filter((id) => resolveKnowledgeItem(id))
        .map((id) => ({ ...applyAnswer(existing.get(id), id, correct, now), label: resolveKnowledgeItem(id)?.label }));
      track("knowledge_question_answered", { correct, items: rows.length });
      if (rows.length) await persistKnowledge(rows);
    },
    [home.knowledge, persistKnowledge],
  );

  const savePreferences = useCallback(
    async (partial: Partial<Preferences> & { onboardingCompleted?: boolean }) => {
      const { onboardingCompleted, ...rest } = partial;
      const merged: Preferences = { ...home.preferences, ...rest };
      setHome((h) => ({ ...h, preferences: merged, onboardingCompleted: onboardingCompleted ?? h.onboardingCompleted }));
      await backendRef.current.savePreferences({ ...merged, ...(onboardingCompleted !== undefined ? { onboardingCompleted } : {}) });
    },
    [home.preferences],
  );

  const saveReflection = useCallback(
    async (dhikrId: string, mood: string, note: string) => {
      const date = localDateStr();
      await backendRef.current.saveReflection(dhikrId, mood, note, date);
      setHome((h) => {
        const others = h.reflections.filter((r) => !(r.dhikrId === dhikrId && r.date === date));
        return { ...h, reflections: [{ dhikrId, date, mood, note: note.trim() || null, createdAt: new Date().toISOString() }, ...others] };
      });
      track("reflection_saved", { hasNote: note.trim().length > 0 });
    },
    [],
  );

  const toggleSaved = useCallback(async (type: string, id: string) => {
    setHome((h) => {
      const exists = h.savedItems.some((s) => s.itemType === type && s.itemId === id);
      return { ...h, savedItems: exists ? h.savedItems.filter((s) => !(s.itemType === type && s.itemId === id)) : [...h.savedItems, { itemType: type, itemId: id }] };
    });
    await backendRef.current.toggleSavedItem(type, id);
  }, []);

  const value = useMemo<Store>(
    () => ({
      mode,
      accountsAvailable,
      user,
      home,
      prefs,
      loading,
      error,
      today,
      online,
      pendingCount,
      backend: backendRef.current,
      toasts,
      notify,
      dismissToast,
      reload,
      beginAsGuest,
      signIn,
      signUp,
      signOut,
      startJourney,
      completeJourneyDay,
      completeDaily,
      saveFreeSession,
      encounterKnowledge,
      answerKnowledge,
      savePreferences,
      saveReflection,
      toggleSaved,
      updateHome,
    }),
    [mode, accountsAvailable, user, home, prefs, loading, error, today, online, pendingCount, toasts, notify, dismissToast, reload, beginAsGuest, signIn, signUp, signOut, startJourney, completeJourneyDay, completeDaily, saveFreeSession, encounterKnowledge, answerKnowledge, savePreferences, saveReflection, toggleSaved, updateHome],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
