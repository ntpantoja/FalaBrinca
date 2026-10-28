const CACHE = "falabrinca-v5";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/manifest.webmanifest", "/icon.svg"])),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("falabrinca-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    event.request.mode === "navigate"
  )
    return;
  if (
    [
      "/api/",
      "/auth/",
      "/conta",
      "/recuperar-senha",
      "/atividades",
      "/admin",
    ].some((path) => url.pathname.startsWith(path)) ||
    url.search ||
    event.request.headers.has("authorization") ||
    event.request.headers.has("rsc")
  )
    return;
  if (
    url.pathname.startsWith("/_next/static/") ||
    [
      "/manifest.webmanifest",
      "/icon.svg",
      "/icon-192.png",
      "/icon-512.png",
    ].includes(url.pathname)
  )
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches
                .open(CACHE)
                .then((cache) => cache.put(event.request, copy));
            }
            return response;
          }),
      ),
    );
});
