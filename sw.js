const CACHE_NAME = 'nivaran-command-cache-v4';
const TILE_CACHE_NAME = 'nivaran-map-tiles-v4';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== TILE_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept Vite dev server module requests on localhost
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // 1. SPA Navigation Requests -> Network first, fallback to cached /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // 2. Map Tiles & Elevation Tiles -> Cache first, then network, fallback to empty 200 if offline
  if (
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('openstreetmap.org') ||
    url.hostname.includes('opentopomap.org') ||
    url.hostname.includes('cartocdn.com') ||
    url.hostname.includes('amazonaws.com')
  ) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cachedTile) => {
          if (cachedTile) return cachedTile;
          return fetch(event.request)
            .then((networkResp) => {
              if (
                networkResp &&
                (networkResp.status === 200 || networkResp.type === 'opaque')
              ) {
                cache.put(event.request, networkResp.clone());
              }
              return networkResp;
            })
            .catch(
              () => new Response('', { status: 200, statusText: 'Offline Tile Fallback' })
            );
        })
      )
    );
    return;
  }

  // 3. Network first, fallback to cache when offline
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
