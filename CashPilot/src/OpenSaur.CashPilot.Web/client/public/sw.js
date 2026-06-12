const appShellCacheName = "cashpilot-shell-v1";
const assetCacheName = "cashpilot-assets-v1";

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isAssetRequest(request) {
  return request.destination === "script"
    || request.destination === "style"
    || request.destination === "image"
    || request.destination === "font";
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName === appShellCacheName || cacheName === assetCacheName) {
          return Promise.resolve();
        }

        return caches.delete(cacheName);
      }),
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || !isSameOrigin(request)) {
    return;
  }

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(appShellCacheName);
        await cache.put("/", networkResponse.clone());
        await cache.put("/index.html", networkResponse.clone());
        return networkResponse;
      } catch {
        const cache = await caches.open(appShellCacheName);
        return (await cache.match(request))
          || (await cache.match("/"))
          || (await cache.match("/index.html"))
          || Response.error();
      }
    })());
    return;
  }

  if (!isAssetRequest(request) && url.pathname !== "/app-config.js") {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(assetCacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse != null) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    } catch {
      return cachedResponse ?? Response.error();
    }
  })());
});
