// Service worker for Gryffin Calorai - handles Web Push reminder notifications.
// Scope: the app's origin root. Registered by pushNotifications.ts on app mount.

self.addEventListener("push", (event) => {
  let title = "Gryffin Calorai";
  let body = "You have a reminder.";
  let tag = "reminder";

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title ?? title;
      body = data.body ?? body;
      tag = data.tag ?? tag;
    } catch {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag,
      renotify: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow("/");
      }),
  );
});
