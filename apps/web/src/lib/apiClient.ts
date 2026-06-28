const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// Legacy key - present if user had an old session before SEC-002 cookie migration.
// Clear it immediately so the plaintext refresh token is not left in localStorage.
const LEGACY_REFRESH_KEY = "gc_refresh_token";
if (typeof localStorage !== "undefined" && localStorage.getItem(LEGACY_REFRESH_KEY)) {
  localStorage.removeItem(LEGACY_REFRESH_KEY);
}

// sessionStorage flag: "1" means the user has an active session in this browser tab.
// Survives page reloads (sessionStorage persists within a tab) but is cleared when the
// tab is closed. The actual credential is the HttpOnly refresh cookie set by the server;
// this flag lets isAuthenticated() remain synchronous.
const SESSION_FLAG_KEY = "gc_session";

let _accessToken: string | null = null;
let _expiresAt: number | null = null;
let _hasSession =
  typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_FLAG_KEY) === "1";

export function getAccessToken(): string | null {
  return _accessToken;
}

export function isAuthenticated(): boolean {
  return (!!_accessToken && !isTokenExpired()) || _hasSession;
}

export function storeTokens(accessToken: string, expiresInSeconds: number): void {
  _accessToken = accessToken;
  _expiresAt = Date.now() + expiresInSeconds * 1000;
  _hasSession = true;
  sessionStorage.setItem(SESSION_FLAG_KEY, "1");
}

export function clearTokens(): void {
  _accessToken = null;
  _expiresAt = null;
  _hasSession = false;
  sessionStorage.removeItem(SESSION_FLAG_KEY);
}

function isTokenExpired(): boolean {
  if (!_accessToken || _expiresAt === null) return true;
  return Date.now() > _expiresAt - 60_000;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh-cookie`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data: { accessToken: string; expiresIn: number } = await res.json();
    storeTokens(data.accessToken, data.expiresIn);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  if (isTokenExpired()) return refreshAccessToken();
  return _accessToken;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getValidToken();
  if (!token) throw new ApiError(401, "Not authenticated");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),

  auth: {
    exchangeToken: async (provider: string, idToken: string) => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, idToken }),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new ApiError(res.status, text);
      }
      const data: { accessToken: string; expiresIn: number } = await res.json();
      storeTokens(data.accessToken, data.expiresIn);
      return data;
    },

    logout: async () => {
      await fetch(`${BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      clearTokens();
    },
  },
};
