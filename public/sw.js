const CACHE_NAME = 'nivaran-command-cache-v5';
const TILE_CACHE_NAME = 'nivaran-map-tiles-v5';

self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const staticAssets = [scope, `${scope}index.html`];
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        staticAssets.map((url) =>
          fetch(url, { cache: 'no-cache' }).then((res) => {
            if (res.ok) return cache.put(url, res);
          })
        )
      )
    )
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

  // 1. SPA Navigation Requests -> Network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    const scope = self.registration.scope;
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
              cache.put(`${scope}index.html`, response.clone());
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) =>
            cached || caches.match(`${scope}index.html`) || caches.match(scope)
          )
        )
    );
    return;
  }

  // 2. Map & Elevation Raster Tiles -> Cache first, then network; on failure return 404 (prevents invalid image decode errors)
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
            .catch(() => new Response(null, { status: 404, statusText: 'Tile Not Found' }));
        })
      )
    );
    return;
  }

  // 3. Static Assets & Scripts -> Network first, fallback to cache
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
