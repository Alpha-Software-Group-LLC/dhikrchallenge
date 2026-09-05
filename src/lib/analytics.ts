/**
 * Privacy-conscious product instrumentation.
 *
 * Events carry counts and identifiers only: never reflection text, never
 * dhikr content, never names. There is no third-party sink; events go to an
 * optional `window.__dhikrAnalytics` hook (for a future first-party collector)
 * and to a small local funnel ledger that the You page can summarise.
 */
import { readJSON, writeJSON } from "./storage";

export type AnalyticsEvent =
  | "onboarding_started"
  | "onboarding_completed"
  | "journey_started"
  | "journey_day_viewed"
  | "dhikr_session_started"
  | "dhikr_session_completed"
  | "lesson_viewed"
  | "knowledge_question_answered"
  | "circle_created"
  | "circle_invite_created"
  | "circle_joined"
  | "encouragement_sent"
  | "reminder_enabled"
  | "reflection_saved"
  | "journey_completed"
  | "free_session_completed";

type Props = Record<string, string | number | boolean | null | undefined>;

const FORBIDDEN_PROPS = new Set(["note", "text", "reflection", "email", "name", "displayName"]);
const LEDGER_KEY = "dhikr:funnel";

declare global {
  interface Window {
    __dhikrAnalytics?: (event: AnalyticsEvent, props: Props, at: string) => void;
  }
}

export function track(event: AnalyticsEvent, props: Props = {}): void {
  const safe: Props = {};
  for (const [k, v] of Object.entries(props)) if (!FORBIDDEN_PROPS.has(k)) safe[k] = v;
  const at = new Date().toISOString();
  try {
    window.__dhikrAnalytics?.(event, safe, at);
  } catch {
    /* never let instrumentation break the app */
  }
  if (import.meta.env.DEV) console.debug("[analytics]", event, safe);
  const ledger = readJSON<Record<string, string>>(LEDGER_KEY, {});
  if (!ledger[event]) {
    ledger[event] = at;
    writeJSON(LEDGER_KEY, ledger);
  }
}

export function funnelFirstSeen(): Record<string, string> {
  return readJSON<Record<string, string>>(LEDGER_KEY, {});
}
