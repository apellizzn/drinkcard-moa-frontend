// DrinkCard MOA — Service Worker
// Strategy: shell-only caching. Static assets cached for fast loads + installability.
// API calls (`/api/*`) and document navigations always hit the network so balances,
// QR codes, and scanner state stay fresh. An offline fallback is shown only when the
// network is unreachable for a navigation request.
//
// Bump CACHE_VERSION on any change to this file or the precached asset list to force
// a clean update on existing clients.

const CACHE_VERSION = "v3";
const STATIC_CACHE = `drinkcard-static-${CACHE_VERSION}`;
// NOTE: Cloudflare's asset handler rewrites `/offline.html` → 307 → `/offline`.
// We follow the redirect during install, then store the offline page under BOTH
// keys as a fresh non-redirected Response so the SW can serve it without the
// browser trying to re-resolve a redirected response (which would 404 offline).
const OFFLINE_URL = "/offline.html";
const OFFLINE_FALLBACK_URL = "/offline";

// Minimal app shell. JS/CSS bundles are hashed by Vite, so we don't precache them —
// they're cached opportunistically on first fetch via the runtime handler below.
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

// Construct a fresh Response that drops the `redirected` flag so the browser
// won't try to re-navigate to the resolved URL when the SW serves it.
async function freshResponse(response) {
  const body = await response.clone().blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

// Try to precache a URL but don't fail the whole install if a single one breaks.
async function precache(cache, urls) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload", redirect: "follow" });
        if (!response.ok) {
          console.warn(`[sw] precache skip ${url}: HTTP ${response.status}`);
          return;
        }
        await cache.put(url, response.redirected ? await freshResponse(response) : response);
      } catch (error) {
        console.warn(`[sw] precache skip ${url}:`, error);
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await precache(cache, PRECACHE_URLS);

      // Cache the offline page under BOTH the original and redirected URLs so the
      // fetch handler can serve it regardless of how the request arrived. We also
      // strip the `redirected` flag — returning a redirected Response from the SW
      // makes the browser re-navigate to its resolved URL, which would fail offline.
      try {
        const response = await fetch(OFFLINE_URL, { cache: "reload", redirect: "follow" });
        if (response.ok) {
          const clean = await freshResponse(response);
          await cache.put(OFFLINE_URL, clean.clone());
          await cache.put(OFFLINE_FALLBACK_URL, clean);
        } else {
          console.warn(`[sw] offline fallback fetch returned ${response.status}`);
        }
      } catch (error) {
        console.warn("[sw] offline fallback precache failed:", error);
      }

      await self.skipWaiting();
    })(),
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
  return PRECACHE_URLS.includes(url.pathname) || url.pathname === OFFLINE_URL || url.pathname === OFFLINE_FALLBACK_URL;
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
          const offline =
            (await cache.match(OFFLINE_URL)) ?? (await cache.match(OFFLINE_FALLBACK_URL));
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
