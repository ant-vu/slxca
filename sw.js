// Simple service worker for caching static assets.
// Note: service workers require HTTPS in production (localhost is allowed).
// derive cache name from URL query param `cacheVersion` if provided
const urlParams =
  typeof self !== "undefined" && self.location
    ? new URL(self.location).searchParams
    : new URL(location.href).searchParams;
const CACHE_NAME = "slxca-cache-" + (urlParams.get("cacheVersion") || "v1");
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/projects.html",
  "/newpage.html",
  "/test.html",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        // remove any cache that doesn't match the current cache name prefix
        Promise.all(
          keys
            .filter((k) => k.indexOf("slxca-cache-") === 0 && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET same-origin requests
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // navigation requests: try network-first, fallback to cached index.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          // store a copy
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Decide which assets should use stale-while-revalidate:
  // CSS/JS/images/fonts -> return cached immediately and update in background
  const staticAssetRe =
    /\.(?:css|js|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|otf)$/i;
  const shouldSWR =
    staticAssetRe.test(url.pathname) ||
    url.pathname.endsWith("/styles.css") ||
    url.pathname.endsWith("/app.js");

  if (shouldSWR) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Default: cache-first then network-with-cache
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resp) => {
          if (!resp || resp.status !== 200 || resp.type !== "basic")
            return resp;
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => {});
    })
  );
});

/**
 * Stale-While-Revalidate implementation: respond with cache immediately (if available),
 * fetch from network in background and update cache for next time. If no cache, wait for network.
 * @param {Request} request
 */
function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const networkFetch = fetch(request)
      .then((resp) => {
        if (resp && resp.status === 200) {
          try {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          } catch (e) {}
        }
        return resp;
      })
      .catch(() => null);

    // If we have a cached response, return it immediately and update cache in background
    if (cached) {
      networkFetch; // start background update
      return cached;
    }

    // otherwise, fall back to network (may be null on failure)
    return networkFetch;
  });
}

// Respond to messages from the page (e.g., skip waiting request)
self.addEventListener("message", (event) => {
  try {
    if (!event.data) return;
    if (event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  } catch (e) {}
});
