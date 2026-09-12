const CACHE = "ipo-ledger-v4";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only ever cache this app's own files. Supabase auth and REST calls must
  // always hit the network, otherwise a stale ledger could be served back.
  if (url.origin !== self.location.origin) return;

  /* The app's own files, not its data. A cached /api/listings would be replayed
     offline as though it were current, and the ledger treats BSE as
     authoritative — stale prices and dates would overwrite good ones. A failed
     request is handled; a convincing wrong answer is not. */
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((r) => r || caches.match("/index.html"))
      )
  );
});

// Tapping a listing-day reminder brings the ledger to the front (or opens it).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          if (client.navigate) { try { client.navigate(url); } catch (e) { /* focus is enough */ } }
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
    })
  );
});
