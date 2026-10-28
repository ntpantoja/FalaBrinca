const CACHE = "falabrinca-v3";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(["/", "/icon.svg", "/manifest.webmanifest"]),
      ),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  // Contas, tokens, checkout e conteúdo de assinantes nunca entram no cache.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/conta") ||
    url.pathname.startsWith("/recuperar-senha") ||
    url.search ||
    event.request.headers.has("authorization") ||
    event.request.headers.has("rsc")
  )
    return;
  if (event.request.mode === "navigate" && url.pathname === "/") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    [
      "/icon.svg",
      "/icon-192.png",
      "/icon-512.png",
      "/manifest.webmanifest",
    ].includes(url.pathname)
  ) {
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
  }
});
