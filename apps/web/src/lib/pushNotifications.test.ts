import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchVapidPublicKey,
  initializePushSubscription,
  registerServiceWorker,
  sendSubscriptionToServer,
  subscribeToPush,
  unsubscribeFromPush,
} from "./pushNotifications";
import { api } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const makeMockSubscription = (endpoint = "https://push.example.com/sub") =>
  ({
    endpoint,
    unsubscribe: vi.fn().mockResolvedValue(true),
    toJSON: vi.fn().mockReturnValue({
      endpoint,
      keys: { p256dh: "BNcKabc", auth: "tBHItJI" },
    }),
  }) as unknown as PushSubscription;

const makeMockRegistration = (existing: PushSubscription | null = null) =>
  ({
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(existing),
      subscribe: vi.fn().mockResolvedValue(makeMockSubscription()),
    },
  }) as unknown as ServiceWorkerRegistration;

beforeEach(() => {
  vi.restoreAllMocks();
  mockApi.get.mockReset();
  mockApi.post.mockReset();
  mockApi.delete.mockReset();
  vi.stubGlobal("Intl", {
    DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: "America/New_York" }) }),
  });
});

describe("registerServiceWorker", () => {
  it("returns undefined when serviceWorker is not in navigator", async () => {
    vi.stubGlobal("navigator", {});
    const result = await registerServiceWorker();
    expect(result).toBeUndefined();
  });

  it("registers and returns the registration", async () => {
    const mockReg = makeMockRegistration();
    vi.stubGlobal("navigator", {
      serviceWorker: { register: vi.fn().mockResolvedValue(mockReg) },
    });
    const result = await registerServiceWorker();
    expect(result).toStrictEqual(mockReg);
  });

  it("returns undefined when registration throws", async () => {
    vi.stubGlobal("navigator", {
      serviceWorker: { register: vi.fn().mockRejectedValue(new Error("fail")) },
    });
    const result = await registerServiceWorker();
    expect(result).toBeUndefined();
  });
});

describe("fetchVapidPublicKey", () => {
  it("returns the key when API responds", async () => {
    mockApi.get.mockResolvedValue({ key: "BMzVapidKey123" });
    const result = await fetchVapidPublicKey();
    expect(result).toBe("BMzVapidKey123");
    expect(mockApi.get).toHaveBeenCalledWith("/api/v1/push/vapid-public-key");
  });

  it("returns undefined when key is empty", async () => {
    mockApi.get.mockResolvedValue({ key: "" });
    const result = await fetchVapidPublicKey();
    expect(result).toBeUndefined();
  });

  it("returns undefined when API throws", async () => {
    mockApi.get.mockRejectedValue(new Error("network"));
    const result = await fetchVapidPublicKey();
    expect(result).toBeUndefined();
  });
});

describe("subscribeToPush", () => {
  it("returns existing subscription without re-subscribing", async () => {
    const existing = makeMockSubscription();
    const reg = makeMockRegistration(existing);
    const result = await subscribeToPush(reg, "BMzVapidKey123");
    expect(result).toStrictEqual(existing);
    expect(reg.pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("creates a new subscription when none exists", async () => {
    const reg = makeMockRegistration(null);
    const result = await subscribeToPush(reg, "BMzVapidKey123");
    expect(result).toBeDefined();
    expect(reg.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    );
  });

  it("returns undefined when subscribe throws (permission denied)", async () => {
    const reg = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockRejectedValue(new Error("NotAllowedError")),
      },
    } as unknown as ServiceWorkerRegistration;
    const result = await subscribeToPush(reg, "BMzVapidKey123");
    expect(result).toBeUndefined();
  });
});

describe("sendSubscriptionToServer", () => {
  it("posts subscription with timezone to the API", async () => {
    mockApi.post.mockResolvedValue(undefined);
    const sub = makeMockSubscription("https://push.example.com/abc");
    await sendSubscriptionToServer(sub);
    expect(mockApi.post).toHaveBeenCalledWith("/api/v1/push/subscribe", {
      endpoint: "https://push.example.com/abc",
      p256dh: "BNcKabc",
      auth: "tBHItJI",
      timezone: "America/New_York",
    });
  });
});

describe("unsubscribeFromPush", () => {
  it("returns false when serviceWorker is not supported", async () => {
    vi.stubGlobal("navigator", {});
    const result = await unsubscribeFromPush();
    expect(result).toBe(false);
  });

  it("returns true and cleans up when subscription exists", async () => {
    const sub = makeMockSubscription("https://push.example.com/abc");
    mockApi.delete.mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(sub) },
        }),
      },
    });
    const result = await unsubscribeFromPush();
    expect(result).toBe(true);
    expect(sub.unsubscribe).toHaveBeenCalled();
    expect(mockApi.delete).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/push/subscribe?endpoint="),
    );
  });

  it("returns true without calling delete when no subscription exists", async () => {
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(null) },
        }),
      },
    });
    const result = await unsubscribeFromPush();
    expect(result).toBe(true);
    expect(mockApi.delete).not.toHaveBeenCalled();
  });
});

describe("initializePushSubscription", () => {
  it("no-ops silently when registerServiceWorker returns undefined", async () => {
    vi.stubGlobal("navigator", {});
    await expect(initializePushSubscription()).resolves.toBeUndefined();
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("no-ops when VAPID key is not configured", async () => {
    const mockReg = makeMockRegistration();
    vi.stubGlobal("navigator", {
      serviceWorker: { register: vi.fn().mockResolvedValue(mockReg) },
    });
    mockApi.get.mockResolvedValue({ key: "" });
    await initializePushSubscription();
    expect(mockReg.pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("completes the full flow when all prerequisites are met", async () => {
    const sub = makeMockSubscription();
    const mockReg = makeMockRegistration(null);
    (mockReg.pushManager.subscribe as ReturnType<typeof vi.fn>).mockResolvedValue(sub);
    vi.stubGlobal("navigator", {
      serviceWorker: { register: vi.fn().mockResolvedValue(mockReg) },
    });
    mockApi.get.mockResolvedValue({ key: "BMzVapidKey123" });
    mockApi.post.mockResolvedValue(undefined);

    await initializePushSubscription();

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/push/subscribe",
      expect.objectContaining({ endpoint: "https://push.example.com/sub" }),
    );
  });
});
