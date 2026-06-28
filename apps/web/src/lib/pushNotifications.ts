import { api } from "@/lib/apiClient";

interface VapidKeyResponse {
  key: string;
}

/** Converts the base64url VAPID public key to the Uint8Array needed by PushManager.subscribe(). */
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

/**
 * Registers the app's service worker (`/sw.js`). Returns the registration on success, or
 * `undefined` when the browser does not support service workers or registration fails.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) return undefined;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return undefined;
  }
}

/**
 * Fetches the VAPID public key from the backend. Returns `undefined` when the server is
 * unreachable or the key is not configured.
 */
export async function fetchVapidPublicKey(): Promise<string | undefined> {
  try {
    const { key } = await api.get<VapidKeyResponse>("/api/v1/push/vapid-public-key");
    return key || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Subscribes the browser to push notifications using the given VAPID public key. Returns an
 * existing subscription without re-subscribing. Returns `undefined` on failure (permission
 * denied, push not supported, network error).
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string,
): Promise<PushSubscription | undefined> {
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  } catch {
    return undefined;
  }
}

/**
 * Sends the browser push subscription to the backend for storage. Includes the current
 * IANA timezone so the server can schedule reminders in local time.
 */
export async function sendSubscriptionToServer(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  await api.post("/api/v1/push/subscribe", {
    endpoint: json.endpoint,
    p256dh: json.keys?.["p256dh"],
    auth: json.keys?.["auth"],
    timezone,
  });
}

/**
 * Unsubscribes from push notifications in the browser and removes the subscription from
 * the backend. Returns `true` if successful.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await api.delete(`/api/v1/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Full push initialization flow: registers the SW, fetches the VAPID key, subscribes, and
 * sends the subscription to the server. Silently no-ops at each step when prerequisites are
 * missing (no SW support, no push support, VAPID not configured, permission denied).
 */
export async function initializePushSubscription(): Promise<void> {
  const reg = await registerServiceWorker();
  if (!reg) return;

  const vapidKey = await fetchVapidPublicKey();
  if (!vapidKey) return;

  const sub = await subscribeToPush(reg, vapidKey);
  if (!sub) return;

  await sendSubscriptionToServer(sub).catch(() => {});
}
