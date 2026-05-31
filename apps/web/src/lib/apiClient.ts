const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const REFRESH_TOKEN_KEY = "gc_refresh_token";

// Access token and expiry live in module memory only - not localStorage.
// This prevents direct token theft via localStorage.getItem() in an XSS scenario.
// The refresh token stays in localStorage so the session survives page reloads.
let _accessToken: string | null = null;
let _expiresAt: number | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  // True if there is an active in-memory session OR a stored refresh token that
  // getValidToken() can silently exchange for a new access token.
  return (!!_accessToken && !isTokenExpired()) || !!getRefreshToken();
}

export function storeTokens(
  accessToken: string,
  refreshToken: string,
  expiresInSeconds: number,
): void {
  _accessToken = accessToken;
  _expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  _accessToken = null;
  _expiresAt = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function isTokenExpired(): boolean {
  if (!_accessToken || _expiresAt === null) return true;
  return Date.now() > _expiresAt - 60_000;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data: { accessToken: string; refreshToken: string; expiresIn: number } = await res.json();
    storeTokens(data.accessToken, data.refreshToken, data.expiresIn);
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
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new ApiError(res.status, text);
      }
      const data: { accessToken: string; refreshToken: string; expiresIn: number } =
        await res.json();
      storeTokens(data.accessToken, data.refreshToken, data.expiresIn);
      return data;
    },

    logout: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await request<void>("/api/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
      clearTokens();
    },
  },
};
