const SHELL_CACHE = 'eleven-shell-v3';
const RUNTIME_CACHE = 'eleven-runtime-v3';
const CONFIG_CACHE = 'eleven-sw-config-v1';
const CONFIG_URL = '/__eleven_sw_preferences__';
const COUNTER_URL = '/__eleven_sw_notification_counter__';
const SHELL_ASSETS = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, CONFIG_CACHE]);
    await Promise.all((await caches.keys()).filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(SHELL_CACHE);
        await cache.put('/index.html', response.clone());
        return response;
      } catch {
        return (await caches.match('/index.html')) || Response.error();
      }
    })());
    return;
  }
  if (!['script', 'style', 'image', 'font'].includes(request.destination)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const update = fetch(request).then(async (response) => {
      if (response.ok) await (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
      return response;
    }).catch(() => null);
    return cached || (await update) || Response.error();
  })());
});

async function readJson(key, fallback) {
  const response = await (await caches.open(CONFIG_CACHE)).match(key);
  if (!response) return fallback;
  try { return await response.json(); } catch { return fallback; }
}

async function writeJson(key, value) {
  await (await caches.open(CONFIG_CACHE)).put(key, new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  }));
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'ELEVEN_NOTIFICATION_PREFERENCES') return;
  const value = event.data.value || {};
  event.waitUntil(writeJson(CONFIG_URL, {
    enabled: value.enabled === true,
    quietHoursStart: Number.isInteger(value.quietHoursStart) ? value.quietHoursStart : 22,
    quietHoursEnd: Number.isInteger(value.quietHoursEnd) ? value.quietHoursEnd : 8,
    timezoneOffsetMinutes: Number.isFinite(value.timezoneOffsetMinutes) ? value.timezoneOffsetMinutes : 0,
  }));
});

function inQuietHours(hour, start, end) {
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    const preferences = await readJson(CONFIG_URL, { enabled: false });
    if (!preferences.enabled || !event.data) return;
    let payload;
    try { payload = event.data.json(); } catch { return; }
    const kind = payload.kind === 'friend-invite' ? 'friend-invite' : 'system';
    const localNow = new Date(Date.now() - Number(preferences.timezoneOffsetMinutes || 0) * 60_000);
    if (inQuietHours(localNow.getUTCHours(), preferences.quietHoursStart, preferences.quietHoursEnd)) return;
    if (kind === 'system') {
      const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const counter = await readJson(COUNTER_URL, { week, count: 0 });
      const count = counter.week === week ? Number(counter.count || 0) : 0;
      if (count >= 2) return;
      await writeJson(COUNTER_URL, { week, count: count + 1 });
    }
    const title = String(payload.title || '11.11 · Echo Network').slice(0, 80);
    const body = String(payload.body || 'A new signal is ready whenever you choose to return.').slice(0, 220);
    const requestedPath = typeof payload.path === 'string' ? payload.path : '/#/echo-network';
    const safePath = requestedPath.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : '/#/echo-network';
    await self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: kind === 'system' ? 'echo-system-signal' : `echo-friend-${String(payload.inviteId || 'signal').slice(0, 60)}`,
      renotify: false,
      silent: false,
      data: { url: new URL(safePath, self.location.origin).toString() },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const requested = new URL(event.notification.data?.url || '/#/echo-network', self.location.origin);
    const safeUrl = requested.origin === self.location.origin
      ? requested.toString()
      : new URL('/#/echo-network', self.location.origin).toString();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.navigate(safeUrl);
        return client.focus();
      }
    }
    return self.clients.openWindow ? self.clients.openWindow(safeUrl) : undefined;
  })());
});
