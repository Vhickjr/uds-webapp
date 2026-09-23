"use client";

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type Role = "superadmin" | "admin" | "intern" | "guest";

export interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
}

interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  /** Ignored by the server — every signup lands as 'intern'. See note below. */
  role?: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  configError: string | null;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isRole = (r: unknown): r is Role =>
  r === "superadmin" || r === "admin" || r === "intern" || r === "guest";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

const toAuthUser = (row: ProfileRow, fallbackEmail: string): AuthUser => ({
  _id: row.id,
  firstName: row.first_name ?? "",
  lastName: row.last_name ?? "",
  email: row.email ?? fallbackEmail,
  phone: row.phone ?? "",
  role: isRole(row.role) ? row.role : "guest",
});

/**
 * Builds a user from auth metadata alone. Used when the profiles row hasn't
 * appeared yet (the handle_new_user trigger races the first read after signup)
 * so the UI has a name to show. Role deliberately defaults to the least
 * privileged value — never infer privilege from client-held metadata.
 */
const fromAuthMetadata = (u: SupabaseUser): AuthUser => {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  return {
    _id: u.id,
    firstName: typeof meta.first_name === "string" ? meta.first_name : "",
    lastName: typeof meta.last_name === "string" ? meta.last_name : "",
    email: u.email ?? "",
    phone: typeof meta.phone === "string" ? meta.phone : "",
    role: "guest",
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const configError = isSupabaseConfigured
    ? null
    : "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";

  /** Loads the profiles row for a session user; falls back to auth metadata. */
  const loadProfile = useCallback(async (authUser: SupabaseUser): Promise<AuthUser> => {
    const supabase = getSupabase();
    if (!supabase) return fromAuthMetadata(authUser);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone, role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("profile load failed:", error.message);
      return fromAuthMetadata(authUser);
    }
    return toAuthUser(data as ProfileRow, authUser.email ?? "");
  }, []);

  // Restore an existing session, then track sign-in/out for the tab's lifetime.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) setUser(await loadProfile(data.session.user));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setUser(newSession?.user ? await loadProfile(newSession.user) : null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signup = useCallback(async (payload: SignupPayload) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error(configError ?? "Supabase unavailable");

    // `role` is intentionally not sent. The handle_new_user trigger always
    // writes 'intern'; elevating is a deliberate database action.
    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone: payload.phone,
        },
      },
    });

    if (error) throw new Error(error.message);
    // onAuthStateChange populates user/session when a session is issued. If
    // email confirmation is on, no session arrives until the link is clicked.
  }, [configError]);

  const login = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error(configError ?? "Supabase unavailable");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, [configError]);

  const logout = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) setUser(await loadProfile(data.user));
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        configError,
        signup,
        login,
        logout,
        refreshMe,
        isAuthenticated: !!user && !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
