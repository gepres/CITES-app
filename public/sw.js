// Service worker mínimo: app-shell offline + PWA instalable.
const VERSION = 'fauna-cites-v1';
const SHELL = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/site.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navegación: red primero, con respaldo a la app cacheada (offline).
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html')),
    );
    return;
  }

  // La API de grabaciones va siempre a la red: si una consulta devolviera
  // lista vacía por un fallo puntual de la fuente, el caché la dejaría fija.
  // (/api/media sí se cachea: son imágenes inmutables.)
  if (sameOrigin && url.pathname === '/api/audio') return;

  // Estáticos del mismo origen: cache-first y se actualiza en segundo plano.
  if (sameOrigin) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok)
              caches.open(VERSION).then((c) => c.put(request, res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
  // Terceros (fuentes, fotos iNaturalist/Wikipedia): se dejan pasar a la red.
});
