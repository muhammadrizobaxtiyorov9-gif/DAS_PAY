/* DasPay Service Worker — Web Push + offline shell + driver page caching */
const CACHE_NAME = 'daspay-v2';
const OFFLINE_URLS = ['/', '/uz/driver', '/ru/driver', '/en/driver'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll fails the entire install if any URL 404s, so try them one by one.
      Promise.all(
        OFFLINE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[sw] precache failed', url, err.message);
          }),
        ),
      ),
    ),
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

/**
 * Network-first for navigations + driver pages, fall back to cache when
 * offline. Static assets fall through to the browser's HTTP cache.
 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Skip API + Next data + cross-origin
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next/data')) return;

  // Only intercept document navigations and known driver routes — leaves
  // hashed JS/CSS/image bundles to Next's own caching.
  const isDocument = req.mode === 'navigate' || req.destination === 'document';
  const isDriverRoute = /\/[a-z]{2}\/driver(\/|$)/.test(url.pathname);

  if (!isDocument && !isDriverRoute) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Clone before caching — Response bodies are read-once streams.
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => null);
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('/')),
      ),
  );
});
