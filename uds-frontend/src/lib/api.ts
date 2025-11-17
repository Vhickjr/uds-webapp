// Centralized API helper for frontend authentication & other requests
// Automatically attaches Authorization header if token is stored.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ApiErrorShape {
  success: false;
  message: string;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('uds_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const contentType = res.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const message = isJson && data && (data as any).message ? (data as any).message : `HTTP ${res.status}`;
      throw new Error(message);
    }
    return data as T;
  } catch (err: unknown) {
    // Differentiate network errors
    if (err instanceof TypeError) {
      throw new Error('Network error / Failed to fetch. Possible CORS or connectivity issue.');
    }
    throw err instanceof Error ? err : new Error('Unknown error');
  }
}

// Same as api but does NOT attach Authorization header (useful for /auth/login, /auth/signup)
export async function apiNoAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const contentType = res.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const message = isJson && data && (data as any).message ? (data as any).message : `HTTP ${res.status}`;
      throw new Error(message);
    }
    return data as T;
  } catch (err: unknown) {
    if (err instanceof TypeError) {
      throw new Error('Network error / Failed to fetch. Possible CORS or connectivity issue.');
    }
    throw err instanceof Error ? err : new Error('Unknown error');
  }
}

interface AuthSuccessUserToken { success: true; data: { user: Record<string, unknown>; token: string } }
interface AuthSuccessUser { success: true; data: { user: Record<string, unknown> } }

export const authApi = {
  signup: (body: Record<string, unknown>) => apiNoAuth<AuthSuccessUserToken>(`/auth/signup`, { method: 'POST', body: JSON.stringify(body) }),
  login: (body: Record<string, unknown>) => apiNoAuth<AuthSuccessUserToken>(`/auth/login`, { method: 'POST', body: JSON.stringify(body) }),
  me: () => api<AuthSuccessUser>(`/auth/me`, { method: 'GET' })
};

export { API_BASE };
