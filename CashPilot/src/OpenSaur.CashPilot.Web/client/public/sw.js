const appShellCacheName = "cashpilot-shell-v2";
const assetCacheName = "cashpilot-assets-v1";
const appShellUrls = ["/", "/index.html", "/app-config.js"];

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isAssetRequest(request) {
  return request.destination === "script"
    || request.destination === "style"
    || request.destination === "image"
    || request.destination === "font";
}

async function cacheResponse(cache, request) {
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}

async function precacheAppShell() {
  const cache = await caches.open(appShellCacheName);
  await Promise.all(
    appShellUrls.map(async (url) => {
      try {
        await cacheResponse(cache, url);
      } catch {
        // Ignore individual shell precache failures; the app can still fall back
        // to whatever was cached previously.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    await precacheAppShell();
    await self.skipWaiting();
  })());
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
        const cache = await caches.open(appShellCacheName);
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          await cache.put("/", networkResponse.clone());
          await cache.put("/index.html", networkResponse.clone());
        }
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
