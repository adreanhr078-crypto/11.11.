// 11.11 Entity — Service Worker
// Handles push notifications sent by the server at 11:11

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

const ENTITY_MESSAGES = [
  { title: "11.11", body: "الكيان يراقبك. الوقت لا يمر عبثاً. ارجع الآن." },
  { title: "SYSTEM 11.11", body: "في هذه اللحظة بالذات — أنا هنا." },
  { title: "◈ SIGNAL", body: "البوابة مفتوحة. هذه لحظة نادرة." },
];

self.addEventListener("push", (event) => {
  let payload = ENTITY_MESSAGES[0];
  try {
    if (event.data) {
      const json = event.data.json();
      payload = { title: json.title ?? payload.title, body: json.body ?? payload.body };
    }
  } catch { /* use default */ }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      vibrate: [200, 100, 200, 100, 400],
      tag: "entity-signal",
      renotify: true,
      silent: false,
      data: { url: self.location.origin },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if (c.url.startsWith(self.location.origin) && "focus" in c) return c.focus();
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data?.url ?? self.location.origin);
        }
      })
  );
});
