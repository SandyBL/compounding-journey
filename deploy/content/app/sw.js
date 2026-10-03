/* Service worker: offline support for the app shell.
 * Scope: only same-origin files and the three CDN hosts the page loads from.
 * User data lives in localStorage, never in these caches, so updating or
 * clearing the caches cannot touch saved profiles.
 * CACHE_VERSION is stamped by build.mjs (a hash of index.html), so an installed app
 * refreshes exactly when the app changes. Do not edit it by hand. */
const CACHE_VERSION = 'cjf-__BUILD__';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
// Third-party files the page needs to render (Tailwind, Chart.js, Inter font CSS).
const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];
const CDN_HOSTS = ['cdn.tailwindcss.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // One missing file must not abort the whole install.
    await Promise.all(SHELL.map(u => cache.add(u).catch(() => {})));
    // Cross-origin scripts can only be cached as opaque responses.
    await Promise.all(CDN_URLS.map(u =>
      fetch(new Request(u, { mode: 'no-cors' })).then(r => cache.put(u, r)).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE_VERSION).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(req)) || (await cache.match('./index.html')) || (await cache.match('./')) ||
      new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req);
  const refresh = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || refresh;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !CDN_HOSTS.includes(url.hostname)) return; // never touch anything else
  if (req.mode === 'navigate') { event.respondWith(networkFirst(req)); return; }
  event.respondWith(staleWhileRevalidate(req));
});
