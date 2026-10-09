/* GDIPS service worker: keeps the app shell usable offline.
 * Same-origin GET requests are network-first and refreshed in the cache.
 * Cross-origin data (Google Sheets CSV, Discord, WhatsApp) is never cached here;
 * the demon list app keeps its own local cache for that data. */
const CACHE = 'gdips-shell-v3';
const SHELL = [
  '/assets/m3/palettes.css',
  '/assets/m3/tokens.css',
  '/assets/m3/components.css',
  '/assets/m3/site.css',
  '/assets/m3/pages.css',
  '/assets/m3/color.js',
  '/assets/m3/ui.js',
  '/assets/vendor/fontawesome/css/all.min.css',
  '/assets/vendor/fonts/roboto-flex-latin-wght-normal.woff2',
  '/assets/vendor/fonts/jetbrains-mono-latin-wght-normal.woff2',
  '/assets/brand/gdips-mark.svg',
  '/assets/brand/icon-192.png',
  '/assets/brand/icon-512.png',
  '/manifest.json',
  '/404.html',
  '/demonlist/styles.css',
  '/demonlist/script.js',
  '/demonlist/demon.png',
  '/demonlist/index.html',
  '/pages/en/main/index.html',
  '/pages/id/utama/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('/404.html');
          return Response.error();
        })
      )
  );
});
