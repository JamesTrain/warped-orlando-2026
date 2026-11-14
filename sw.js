/* Keep all URLs relative: this app is deployed under a GitHub Pages repo path. */
const APP_PREFIX = `warped-orlando-2026:${new URL(self.registration.scope).pathname}:`;
const CACHE_NAME = `${APP_PREFIX}v2`;
const SHELL = [
  './', './index.html', './styles.css', './app.js', './geo.js', './config.js',
  './manifest.webmanifest', './assets/leaflet.js', './assets/leaflet.css',
  './assets/festival-map.png', './assets/icon.svg', './assets/icon-192.png',
  './assets/icon-512.png', './assets/icon-maskable-512.png', './assets/icon-180.png'
];
const SHELL_URLS = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
const INDEX_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  // addAll is atomic: an incomplete download must never be marked offline-ready.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(APP_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.href.startsWith(self.registration.scope) || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      // Keep this release's HTML and scripts together until its new worker
      // activates. Never overwrite the installed shell with newer markup.
      const cached = await cache.match(INDEX_URL);
      if (cached) return cached;
      return fetch(request);
    })());
    return;
  }

  // Only the explicit app shell is cached. GPS data and online map tiles are not.
  if (url.search || !SHELL_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
