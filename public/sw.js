// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: '🛒 New Order', body: 'A new order has been placed.', url: '/admin/orders', tag: 'new-order', icon: '/only_logo.webp' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/only_logo.webp',
      tag: data.tag,
      renotify: true,
      silent: false,
      vibrate: [300, 100, 300, 100, 300],
      data: { url: data.url },
      actions: [{ action: 'view', title: 'View Order' }],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin/orders';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Caching ───────────────────────────────────────────────────────────────────
const SHELL_CACHE = 'glimore-shell-v3';
const ASSET_CACHE = 'glimore-assets-v3';
const IMAGE_CACHE = 'glimore-images-v3';

const SKIP_PATTERNS = [
  /firestore\.googleapis\.com/,
  /firebase\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /firebaseapp\.com/,
  /\/api\//,
  /chrome-extension/,
  /\/_next\//,       // Next.js bundles — hash-named, let the browser HTTP cache handle them
];

function shouldSkip(url) {
  return SKIP_PATTERNS.some((p) => p.test(url));
}

// Install: skip waiting immediately so new SW activates fast
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(['/', '/products', '/cart', '/account'])
        .catch(() => cache.add('/'))
    )
  );
  self.skipWaiting();
});

// Activate: purge old caches
self.addEventListener('activate', (event) => {
  const alive = new Set([SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !alive.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Only handle GET; skip firebase, API, chrome-extension
  if (request.method !== 'GET' || shouldSkip(url)) return;

  const urlObj = new URL(url);

  // Remote images (Cloudinary, Unsplash) — cache-first with network fallback
  if (
    urlObj.hostname.includes('res.cloudinary.com') ||
    urlObj.hostname.includes('images.unsplash.com') ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // HTML navigation — network-first, fall back to cached page or homepage
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }

  // Everything else (fonts, misc) — network-first
  event.respondWith(networkFirst(request, SHELL_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function networkFirstNav(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await cache.match('/'));
    return cached || new Response('<h1>You are offline</h1>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
