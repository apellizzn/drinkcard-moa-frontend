// DrinkCard MOA — Service Worker
// Strategy: shell-only caching. Static assets cached for fast loads + installability.
// API calls (`/api/*`) and document navigations always hit the network so balances,
// QR codes, and scanner state stay fresh. An offline fallback is shown only when the
// network is unreachable for a navigation request.
//
// Bump CACHE_VERSION on any change to this file or the precached asset list to force
// a clean update on existing clients.

const CACHE_VERSION = "v1";
const STATIC_CACHE = `drinkcard-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Minimal app shell. JS/CSS bundles are hashed by Vite, so we don't precache them —
// they're cached opportunistically on first fetch via the runtime handler below.
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("drinkcard-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Allow the page to trigger an immediate activation after a new SW is detected.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isHashedAsset(url) {
  // Vite emits hashed filenames under /assets/ and /_build/. These are immutable, safe to cache.
  return url.pathname.startsWith("/assets/") || url.pathname.startsWith("/_build/");
}

function isPrecachedStatic(url) {
  return PRECACHE_URLS.includes(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API: always network. Never cached, never queued offline. Stale balances would be unsafe.
  if (isApiRequest(url)) return;

  // Navigations: network-first, fall back to a cached offline page when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return offline ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Hashed assets and precached statics: cache-first.
  if (isHashedAsset(url) || isPrecachedStatic(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          if (cached) return cached;
          throw new Error("Network error and no cache match");
        }
      })(),
    );
    return;
  }

  // Everything else (e.g. fonts from Google CDN already excluded by origin check above):
  // default to network with a cache fallback if a previous response exists.
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error("Network error and no cache match");
      }
    })(),
  );
});
