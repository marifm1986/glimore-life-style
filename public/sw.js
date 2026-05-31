const SHELL_CACHE = 'glimore-shell-v1';
const ASSET_CACHE = 'glimore-assets-v1';
const IMAGE_CACHE = 'glimore-images-v1';

const SKIP_PATTERNS = [
  /firestore\.googleapis\.com/,
  /firebase\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /firebaseapp\.com/,
  /\/api\//,
  /chrome-extension/,
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

  // Next.js hashed static bundles — cache-first forever (content-hashed filenames)
  if (urlObj.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

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
