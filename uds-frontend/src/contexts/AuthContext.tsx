import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";

export type Role = "admin" | "intern" | "guest"; // backend roles

export interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  isAuthenticated: boolean;
}

interface SignupPayload extends Record<string, unknown> {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: Role;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "uds_auth_user";
const TOKEN_KEY = "uds_auth_token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persisted auth
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(USER_KEY);
      const rawToken = localStorage.getItem(TOKEN_KEY);
      if (rawUser && rawToken) {
        setUser(JSON.parse(rawUser));
        setToken(rawToken);
      }
    } catch {/* ignore */}
    finally {
      setLoading(false);
    }
  }, []);

  const persist = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      localStorage.setItem(TOKEN_KEY, t);
    } catch {/* ignore */}
  };

  const normalizeUser = (raw: unknown): AuthUser | null => {
    const maybe = raw as Partial<AuthUser> & Record<string, unknown>;
    const isRole = (r: any): r is Role => r === "admin" || r === "intern" || r === "guest";

    if (
      maybe &&
      typeof maybe._id === "string" &&
      typeof maybe.firstName === "string" &&
      typeof maybe.lastName === "string" &&
      typeof maybe.email === "string" &&
      typeof maybe.phone === "string"
    ) {
      return {
        _id: maybe._id,
        firstName: maybe.firstName,
        lastName: maybe.lastName,
        email: maybe.email,
        phone: maybe.phone,
        role: isRole(maybe.role) ? (maybe.role as Role) : "guest",
      };
    }
    return null;
  };

  const signup = async (payload: SignupPayload) => {
    const res = await authApi.signup(payload);
    const u = normalizeUser(res.data.user);
    if (!u) throw new Error("Invalid user payload from signup");
    persist(u, res.data.token);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const u = normalizeUser(res.data.user);
    if (!u) throw new Error("Invalid user payload from login");
    persist(u, res.data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {/* ignore */}
  };

  const refreshMe = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authApi.me();
      if (res.data.user) {
        // validate and normalize the user object returned from the API
        const raw = res.data.user as unknown;
        const maybe = raw as Partial<AuthUser> & Record<string, unknown>;
        const isRole = (r: any): r is Role => r === "admin" || r === "intern" || r === "guest";

        if (
          maybe &&
          typeof maybe._id === "string" &&
          typeof maybe.firstName === "string" &&
          typeof maybe.lastName === "string" &&
          typeof maybe.email === "string" &&
          typeof maybe.phone === "string"
        ) {
          const normalized: AuthUser = {
            _id: maybe._id,
            firstName: maybe.firstName,
            lastName: maybe.lastName,
            email: maybe.email,
            phone: maybe.phone,
            role: isRole(maybe.role) ? (maybe.role as Role) : "guest",
          };
          setUser(normalized);
          localStorage.setItem(USER_KEY, JSON.stringify(normalized));
        } else {
          // malformed user payload — clear auth
          logout();
        }
      }
    } catch (e) {
      // token invalid
      logout();
    }
  }, [token]);

  useEffect(() => {
    // validate token when available
    if (token) refreshMe();
  }, [token, refreshMe]);

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout, refreshMe, isAuthenticated: !!user && !!token }}>
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
