const CACHE = "chordly-shell-__BUILD_HASH__";
const APP_SHELL = /* precache */ [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter(
            (key) =>
              key !== CACHE &&
              (key.startsWith("chordly-shell-") || key === "chordly-v1"),
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) return response;
          return (
            (await (await caches.open(CACHE)).match("/index.html")) || response
          );
        })
        .catch(async () => {
          const cached = await (await caches.open(CACHE)).match("/index.html");
          if (cached) return cached;
          return Response.error();
        }),
    );
    return;
  }

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches
        .open(CACHE)
        .then(async (cache) => (await cache.match(request)) || fetch(request)),
    );
  }
});
