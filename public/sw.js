const VERSION = "gym-tracker-pwa-v1";
const APP_CACHE = `${VERSION}-app`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const STATIC_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/app-icon.svg",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

async function cacheAppShell() {
  const cache = await caches.open(APP_CACHE);
  await cache.addAll(STATIC_URLS);

  const response = await fetch("/", { cache: "reload" });
  await cache.put("/", response.clone());

  const html = await response.text();
  const assetUrls = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith("/assets/"));

  await Promise.all(
    assetUrls.map((url) =>
      cache.add(url).catch((error) => {
        console.warn("Failed to cache app asset:", url, error);
      })
    )
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => !cacheName.startsWith(VERSION))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(APP_CACHE);
    cache.put("/", response.clone());
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match("/")) ||
      (await caches.match("/index.html")) ||
      new Response("Gym Tracker is offline and the app shell is unavailable.", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(navigationResponse(event.request));
    return;
  }

  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
