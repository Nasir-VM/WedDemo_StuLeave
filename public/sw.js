const CACHE_NAME = 'agy-leave-v1';
const STATIC_ASSETS = [
  '/offline',
  '/styles/global.css',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/student') ||
    url.pathname.startsWith('/review') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/stats') ||
    url.pathname === '/login' ||
    url.pathname === '/change-password'
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/offline');
        }
        return new Response(JSON.stringify({ error: '離線狀態且無可用快取' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      if (request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/offline');
      }
    })
  );
});
