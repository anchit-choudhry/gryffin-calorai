import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  ApiError,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  storeTokens,
} from "./apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    clearTokens();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearTokens();
    localStorage.clear();
  });

  describe("token management", () => {
    it("stores and retrieves access token", () => {
      storeTokens("access-token", "refresh-token", 3600);
      expect(getAccessToken()).toBe("access-token");
    });

    it("stores and retrieves refresh token", () => {
      storeTokens("access-token", "refresh-token", 3600);
      expect(getRefreshToken()).toBe("refresh-token");
    });

    it("isAuthenticated returns true when access token exists", () => {
      storeTokens("access-token", "refresh-token", 3600);
      expect(isAuthenticated()).toBe(true);
    });

    it("isAuthenticated returns false when no tokens exist", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("isAuthenticated returns false when access token is expired and no refresh token", () => {
      // expiresIn: 0 means _expiresAt = Date.now(), so isTokenExpired() is immediately true
      storeTokens("expired-token", "temp-refresh", 0);
      localStorage.removeItem("gc_refresh_token");
      expect(isAuthenticated()).toBe(false);
    });

    it("isAuthenticated returns true when only refresh token exists (session restore)", () => {
      // Simulates a page reload: access token gone from memory, refresh token in localStorage
      localStorage.setItem("gc_refresh_token", "stored-refresh-token");
      expect(isAuthenticated()).toBe(true);
    });

    it("clears all tokens", () => {
      storeTokens("access-token", "refresh-token", 3600);
      clearTokens();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it("token is valid immediately after storeTokens with positive expiry", () => {
      storeTokens("access-token", "refresh-token", 3600);
      // isAuthenticated() is true only when the access token is present and not expired
      expect(isAuthenticated()).toBe(true);
      expect(getAccessToken()).toBe("access-token");
    });

    it("access token is not persisted to localStorage", () => {
      storeTokens("access-token", "refresh-token", 3600);
      // The access token lives in memory only - it must not appear in localStorage
      expect(localStorage.getItem("gc_access_token")).toBeNull();
    });

    it("getAccessToken returns null when not set", () => {
      expect(getAccessToken()).toBeNull();
    });

    it("getRefreshToken returns null when not set", () => {
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe("api requests", () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn();
      storeTokens("valid-token", "refresh-token", 3600);
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
        refreshToken: "new-refresh-token",
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

    it("api.auth.logout calls logout endpoint and clears tokens", async () => {
      storeTokens("access-token", "refresh-token", 3600);
      globalThis.fetch = vi.fn();
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as unknown as Response);

      await api.auth.logout();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/logout"),
        expect.any(Object),
      );
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it("api.auth.logout clears tokens even if endpoint fails", async () => {
      storeTokens("access-token", "refresh-token", 3600);
      globalThis.fetch = vi.fn();
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("Network error"));

      await api.auth.logout();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it("api.auth.logout does nothing if no refresh token", async () => {
      globalThis.fetch = vi.fn();

      await api.auth.logout();

      expect(globalThis.fetch).not.toHaveBeenCalled();
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
