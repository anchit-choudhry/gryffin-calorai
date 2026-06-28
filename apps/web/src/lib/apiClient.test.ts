import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  ApiError,
  clearTokens,
  getAccessToken,
  isAuthenticated,
  storeTokens,
} from "./apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    clearTokens();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearTokens();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("token management", () => {
    it("stores and retrieves access token", () => {
      storeTokens("access-token", 3600);
      expect(getAccessToken()).toBe("access-token");
    });

    it("isAuthenticated returns true when valid access token exists", () => {
      storeTokens("access-token", 3600);
      expect(isAuthenticated()).toBe(true);
    });

    it("isAuthenticated returns false when no tokens exist", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("isAuthenticated returns true via _hasSession even when access token is expired", () => {
      // expiresIn=0 means _expiresAt = Date.now(); the 60-second buffer in
      // isTokenExpired() makes this token immediately stale.
      // _hasSession is still true, so isAuthenticated() remains true.
      storeTokens("stale-token", 0);
      expect(isAuthenticated()).toBe(true);
    });

    it("isAuthenticated returns false after clearTokens removes session flag", () => {
      storeTokens("access-token", 3600);
      clearTokens();
      expect(isAuthenticated()).toBe(false);
    });

    it("clears access token", () => {
      storeTokens("access-token", 3600);
      clearTokens();
      expect(getAccessToken()).toBeNull();
    });

    it("storeTokens sets sessionStorage flag", () => {
      storeTokens("access-token", 3600);
      expect(sessionStorage.getItem("gc_session")).toBe("1");
    });

    it("clearTokens removes sessionStorage flag", () => {
      storeTokens("access-token", 3600);
      clearTokens();
      expect(sessionStorage.getItem("gc_session")).toBeNull();
    });

    it("token is valid immediately after storeTokens with positive expiry", () => {
      storeTokens("access-token", 3600);
      expect(isAuthenticated()).toBe(true);
      expect(getAccessToken()).toBe("access-token");
    });

    it("access token is not persisted to localStorage", () => {
      storeTokens("access-token", 3600);
      expect(localStorage.getItem("gc_access_token")).toBeNull();
    });

    it("getAccessToken returns null when not set", () => {
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("api requests", () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn();
      storeTokens("valid-token", 3600);
    });

    it("api.get makes GET request", async () => {
      const mockData = { id: 1, name: "Apple" };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Response);

      const result = await api.get("/api/v1/food-items");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/food-items"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer valid-token",
          }),
        }),
      );
      expect(result).toStrictEqual(mockData);
    });

    it("api.post makes POST request", async () => {
      const mockData = { id: 1, name: "Apple" };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Response);

      const payload = { name: "Apple", calories: 80 };
      const result = await api.post("/api/v1/food-items", payload);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/food-items"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        }),
      );
      expect(result).toStrictEqual(mockData);
    });

    it("api.put makes PUT request", async () => {
      const mockData = { id: 1, name: "Updated" };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Response);

      const payload = { name: "Updated" };
      const result = await api.put("/api/v1/food-items/1", payload);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/food-items/1"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(payload),
        }),
      );
      expect(result).toStrictEqual(mockData);
    });

    it("api.delete makes DELETE request", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as unknown as Response);

      await api.delete("/api/v1/food-items/1");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/food-items/1"),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });

    it("throws ApiError on failed request", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: vi.fn().mockResolvedValue("Invalid payload"),
      } as unknown as Response);

      await expect(api.get("/api/v1/invalid")).rejects.toThrow(ApiError);
    });

    it("throws 401 error when not authenticated", async () => {
      clearTokens();

      await expect(api.get("/api/v1/food-items")).rejects.toThrow(
        expect.objectContaining({
          status: 401,
          message: "Not authenticated",
        }),
      );
    });

    it("handles 204 No Content response", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as unknown as Response);

      const result = await api.delete("/api/v1/food-items/1");

      expect(result).toBeUndefined();
    });

    it("includes Content-Type and Authorization headers", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

      await api.get("/api/v1/test");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/test"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          }),
        }),
      );
    });
  });

  describe("authentication", () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn();
    });

    it("api.auth.exchangeToken exchanges provider token for app token", async () => {
      const mockResponse = {
        accessToken: "new-access-token",
        expiresIn: 3600,
      };

      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await api.auth.exchangeToken("google", "google-id-token");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/token"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ provider: "google", idToken: "google-id-token" }),
        }),
      );
      expect(result).toStrictEqual(mockResponse);
      expect(getAccessToken()).toBe("new-access-token");
    });

    it("api.auth.exchangeToken throws error on failure", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: vi.fn().mockResolvedValue("Invalid token"),
      } as unknown as Response);

      await expect(api.auth.exchangeToken("google", "invalid-token")).rejects.toThrow(ApiError);
    });

    it("api.auth.logout calls logout endpoint with credentials and clears tokens", async () => {
      storeTokens("access-token", 3600);
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as unknown as Response);

      await api.auth.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/logout"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
      expect(getAccessToken()).toBeNull();
      expect(sessionStorage.getItem("gc_session")).toBeNull();
    });

    it("api.auth.logout clears tokens even if endpoint fails", async () => {
      storeTokens("access-token", 3600);
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("Network error"));

      await api.auth.logout();

      expect(getAccessToken()).toBeNull();
      expect(sessionStorage.getItem("gc_session")).toBeNull();
    });

    it("api.auth.logout always calls the endpoint regardless of token state", async () => {
      // The HttpOnly cookie is sent automatically by the browser - logout must
      // always hit the server to revoke the cookie, even without an in-memory token.
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as unknown as Response);

      await api.auth.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/logout"),
        expect.any(Object),
      );
    });
  });

  describe("ApiError", () => {
    it("creates error with status and message", () => {
      const error = new ApiError(404, "Not found");

      expect(error.status).toBe(404);
      expect(error.message).toBe("Not found");
      expect(error.name).toBe("ApiError");
    });

    it("is instanceof Error", () => {
      const error = new ApiError(500, "Server error");
      expect(error instanceof Error).toBe(true);
    });
  });
});
