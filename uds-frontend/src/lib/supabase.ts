import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True once both env vars are set. Everything that talks to Supabase checks
 * this first and falls back to local storage, so the app still runs before a
 * project exists.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Returns the shared browser client, or null when Supabase isn't configured. */
export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
};
