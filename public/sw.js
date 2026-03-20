// ATHENEA Service Worker — offline cache for app shell
const CACHE_NAME = 'athenea-v1';

// Files to cache on install (app shell)
const PRECACHE = [
  './',
  './index.html',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin or static assets
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Pass through API calls (Google, AI providers) — never cache
  if (
    url.hostname.includes('googleapis') ||
    url.hostname.includes('openai') ||
    url.hostname.includes('groq')
  ) {
    return;
  }

  // Network-first for navigation (always fresh HTML if online)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for JS/CSS/image assets (versioned by Vite hash)
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached || fetch(event.request).then((response) => {
        // Cache new versioned assets
        if (response.ok && url.pathname.includes('/assets/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
    )
  );
});
