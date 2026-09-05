import type { SupabaseClient } from "@supabase/supabase-js";

let clientPromise: Promise<SupabaseClient> | null = null;

export class ConfigUnavailableError extends Error {
  constructor(message = "Accounts are not available in this environment.") {
    super(message);
    this.name = "ConfigUnavailableError";
  }
}

/** Public Supabase configuration is served by /api/config; keys are client-public by design. */
export function getSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const desktopOrigin = (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ? "https://dhikrchallenge.com" : "";
      let response: Response;
      try {
        response = await fetch(`${desktopOrigin}/api/config`, { credentials: "omit" });
      } catch {
        throw new ConfigUnavailableError("We couldn't reach the sign-in service. Check your connection and try again.");
      }
      let config: { url?: string; publishableKey?: string; error?: string } = {};
      try {
        config = await response.json();
      } catch {
        throw new ConfigUnavailableError();
      }
      if (!response.ok || !config.url || !config.publishableKey) throw new ConfigUnavailableError(config.error);
      const { createClient } = await import("@supabase/supabase-js");
      return createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    })().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}
