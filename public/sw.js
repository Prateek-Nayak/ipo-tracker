const CACHE = "ipo-ledger-v5";
// Public VAPID key, for re-subscribing if the push endpoint rotates. Public by
// design (it also ships in the app bundle); the private key lives only server-side.
const VAPID_PUBLIC_KEY = "BBMs6l_rEsHHDLXJPUvI3y5i31VLaUN8OlkhdThwgPJFcrqba_YhVcz_Jd-a6VYZgvLDvlvX_u9xTOuxld0cwKU";
function vapidKeyBytes(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
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

// A push from the server (approach B): show it. Payload is JSON with the same
// shape the app uses for its foreground notifications.
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { title: "The Ledger", body: event.data ? event.data.text() : "" }; }
  const title = payload.title || "The Ledger";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/badge-96.png",
    tag: payload.tag || "listing",
    data: payload.data || { url: "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// If the browser rotates the push endpoint, re-subscribe so delivery continues;
// the app re-stores the new endpoint (keyed by user) on its next open.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKeyBytes(VAPID_PUBLIC_KEY),
    }).catch(() => {})
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
