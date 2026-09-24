import { createClient } from "@supabase/supabase-js";

/**
 * Verifies the caller's Supabase access token server-side.
 *
 * Without this, /api/llm/* is an open proxy to a paid model — anyone who finds
 * the URL can spend your API credits. The token comes from the browser's
 * Supabase session; we validate it against Supabase rather than trusting it.
 */
export interface CallerProfile {
  id: string;
  email: string | null;
  role: string | null;
}

export const requireUser = async (
  req: Request
): Promise<{ user: CallerProfile } | { error: string; status: number }> => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Not authenticated", status: 401 };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { error: "Supabase is not configured on the server", status: 500 };
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: "Invalid session", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
      role: (profile?.role as string) ?? null,
    },
  };
};
