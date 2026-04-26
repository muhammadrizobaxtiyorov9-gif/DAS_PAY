/* DasPay Service Worker — Web Push + offline shell */
const CACHE_NAME = 'daspay-v1';
const OFFLINE_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => null),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = { title: 'DasPay', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'DasPay';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
    tag: payload.tag,
    data: { url: payload.url || '/', ...(payload.data || {}) },
    requireInteraction: false,
    vibrate: [120, 60, 120],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.navigate(url).catch(() => null);
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  // Only GETs through the cache; ignore everything else
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Skip API + Next internals
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next/data')) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((r) => r || caches.match('/'))),
  );
});
